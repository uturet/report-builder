import Papa from "papaparse";
import type { Database as SqlJsDatabase } from "sql.js";

export type TablesTypes = {
  [key: string]: {
    columns: string[],
    types: string[]
  }
}

function sanitizeIdentifier(s: string) {
  let name = s || "col";
  name = name.replace(/^\uFEFF/, "").trim();
  name = name.replace(/[^a-zA-Z0-9_]/g, "_");
  if (!name) name = "col";
  if (/^[0-9]/.test(name)) name = "_" + name;
  return name.slice(0, 60);
}

function uniqueNames(names: string[]) {
  const seen: Record<string, number> = {};
  return names.map((n) => {
    let out = n;
    if (!(out in seen)) {
      seen[out] = 0;
      return out;
    }
    seen[out] += 1;
    out = `${out}_${seen[out]}`;
    while (out in seen) {
      seen[out] += 1;
      out = `${n}_${seen[out]}`;
    }
    seen[out] = 0;
    return out;
  });
}

function inferColumnType(sampleValues: (string | null)[]) {
  let isInt = true;
  let isReal = true;
  let isDate = true;
  let anyNonNull = false;

  for (const v of sampleValues) {
    if (v === null || v === undefined || v === "") continue;
    anyNonNull = true;
    const s = String(v).trim();
    if (!/^-?\d+$/.test(s)) isInt = false;
    if (!/^-?\d+(\.\d+)?$/.test(s)) isReal = false;
    if (!/^\d{4}-\d{2}-\d{2}([T\s].*)?$/.test(s)) isDate = false;
    if (!isInt && !isReal && !isDate) break;
  }

  if (!anyNonNull) return "TEXT";
  if (isInt) return "INTEGER";
  if (isReal) return "REAL";
  if (isDate) return "TEXT";
  return "TEXT";
}

function createTableSQL(tableName: string, cols: string[], types: string[]) {
  const colsSql = cols.map((c, i) => `"${c.replace(/"/g, '""')}" ${types[i]}`).join(", ");
  return `CREATE TABLE IF NOT EXISTS "${tableName.replace(/"/g, '""')}" (${colsSql});`;
}

export async function handleFiles(
  files: FileList | null,
  ensureSqlJs: () => Promise<void>,
  db: SqlJsDatabase,
  setInvalid: () => void,
  setTables: (t: string) => void,
  setTableTypes: (tt: TablesTypes) => void
) {
  if (!files || files.length === 0) return;
  await ensureSqlJs();

  for (const file of Array.from(files)) {
    const filenameBase = file.name.replace(/\.[^/.]+$/, "");
    let tableName = sanitizeIdentifier(filenameBase);
    const existingTables = db.exec(`SELECT name FROM sqlite_master WHERE type='table';`);
    const existingNames =
      existingTables && existingTables[0] ? existingTables[0].values.flat() : [];
    let idx = 1;
    while (existingNames.includes(tableName)) {
      tableName = `${sanitizeIdentifier(filenameBase)}_${idx++}`;
    }


    const SAMPLE_SIZE = 1000;
    const sampleRows: string[][] = [];
    let headersRaw: string[] | null = null;
    let parsedHeader = false;
    let aborted = false;

    const batchSize = 500;
    let insertStmt: ReturnType<SqlJsDatabase["prepare"]> | null = null;
    let headerCols: string[] = [];

    function prepareTableFromSample() {
      const sanitized = (headersRaw || []).map((h) =>
        sanitizeIdentifier(h || "col")
      );
      const unique = uniqueNames(sanitized);
      headerCols = unique;

      const samplesPerCol: (string | null)[][] = headerCols.map(() => []);
      for (const row of sampleRows) {
        for (let i = 0; i < headerCols.length; i++) {
          samplesPerCol[i].push(row[i] ?? null);
        }
      }
      const types = samplesPerCol.map((s) => inferColumnType(s));

      

      const createSQL = createTableSQL(tableName, headerCols, types);
      db.run("BEGIN TRANSACTION;");
      db.run(createSQL);
      db.run("COMMIT;");

      const colsQuoted = headerCols.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
      const placeholders = headerCols.map(() => "?").join(",");
      const insertSQL = `INSERT INTO "${tableName.replace(/"/g, '""')}" (${colsQuoted}) VALUES (${placeholders});`;
      insertStmt = db.prepare(insertSQL);

      setTableTypes({
        [tableName]: {
          columns: headerCols,
          types: types
        }
      })
    }

    function runBatch(rows: (string | null)[][]) {
      if (!insertStmt) throw new Error("Insert statement not prepared");
      for (const r of rows) {
        const values = (r as unknown as any[]).slice(0, headerCols.length).map((v) => {
          if (v === "") return null;
          return v;
        });
        insertStmt.run(values);
      }
    }

    await new Promise<void>((resolve, reject) => {
      let rowsBuffer: string[][] = [];
      let totalRows = 0;
      let firstStep = true;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        worker: true,
        dynamicTyping: false,
        step: function (results, parser) {
          if (aborted) {
            parser.abort();
            reject(new Error("aborted"));
            return;
          }

          if (!parsedHeader) {
            headersRaw = results.meta.fields || null;
            parsedHeader = true;
          }

          const rowObj = results.data as any;
          const rowArr = (headersRaw || []).map((h) => {
            const v = rowObj[h];
            return v === undefined ? "" : String(v);
          });

          if (sampleRows.length < SAMPLE_SIZE) {
            sampleRows.push(rowArr);
          }

          rowsBuffer.push(rowArr);
          totalRows += 1;

          if (sampleRows.length === SAMPLE_SIZE && !insertStmt) {
            prepareTableFromSample();
            db.run("BEGIN TRANSACTION;");
            try {
              runBatch(sampleRows);
              db.run("COMMIT;");
            } catch (err) {
              try { db.run("ROLLBACK;"); } catch (e) { }
              parser.abort();
              reject(err);
              return;
            }
            rowsBuffer = [];
          }

          if (insertStmt && rowsBuffer.length >= batchSize) {
            db.run("BEGIN TRANSACTION;");
            try {
              runBatch(rowsBuffer);
              db.run("COMMIT;");
            } catch (err) {
              try { db.run("ROLLBACK;"); } catch (e) { }
              parser.abort();
              reject(err);
              return;
            }
            rowsBuffer = [];
          }

          firstStep = false;
        },
        complete: function () {
          try {
            if (!parsedHeader) {
              setInvalid()
              resolve();
              return;
            }
            if (!insertStmt) {
              prepareTableFromSample();
              db.run("BEGIN TRANSACTION;");
              try {
                runBatch(sampleRows);
                db.run("COMMIT;");
              } catch (err) {
                try { db.run("ROLLBACK;"); } catch (e) { }
                reject(err);
                return;
              }
              resolve();
              return;
            }

            if (rowsBuffer.length > 0) {
              db.run("BEGIN TRANSACTION;");
              try {
                runBatch(rowsBuffer);
                db.run("COMMIT;");
              } catch (err) {
                try { db.run("ROLLBACK;"); } catch (e) { }
                reject(err);
                return;
              }
            }
            resolve();
          } catch (err) {
            reject(err);
          } finally {
            try {
              if (insertStmt) {
                insertStmt.free();
              }
            } catch (e) { }
          }
        },
        error: function (err) {
          aborted = true;
          reject(err);
        },
      });
    });

    setTables(tableName);
  }
}


