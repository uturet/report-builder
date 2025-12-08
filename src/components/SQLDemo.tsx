import React, { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic, QueryExecResult } from "sql.js";

type TablesTypes = {
  [key: string]: {
    columns: string[],
    types: string[]
  }
}

/**
 * Props:
 *  - db?: existing sql.js Database instance. If omitted we'll init one internally.
 *  - wasmPath?: URL to sql-wasm.wasm (defaults to "/sql-wasm.wasm")
 */
export default function CsvToSqlImporter({
  db: externalDb,
  wasmPath = "/sql-wasm.wasm",
}: {
  db?: SqlJsDatabase;
  wasmPath?: string;
}) {
  const [status, setStatus] = useState<string>("idle");
  const [tables, setTables] = useState<string[]>([]);
  const dbRef = useRef<SqlJsDatabase | null>(externalDb ?? null);
  const SQLRef = useRef<SqlJsStatic | null>(null);
  const [tableTypes, setTableTypes] = useState<TablesTypes>({})
  const [userSQL, setUserSQL] = useState<QueryExecResult|string>("")
  const [SQLResult, setSQLREsult] = useState<string>("")

  useEffect(() => {
    if (!userSQL || !dbRef.current) {
      setSQLREsult("")
      return
    }
    try {
      const result: QueryExecResult[] = dbRef.current.exec(userSQL)
      setSQLREsult(result[0])
    } catch (error) {
      if (error instanceof Error) {
        setSQLREsult(error.message)
      } else {
        setSQLREsult(`Error: ${error}`)
      }
    }
  }, [userSQL])


  async function ensureSqlJs() {
    if (!SQLRef.current) {
      setStatus("loading sql.js...");
      const SQL = await initSqlJs({ locateFile: () => wasmPath });
      SQLRef.current = SQL;
      setStatus("sql.js loaded");
    }
    if (!dbRef.current) {
      // create an in-memory DB if not provided
      dbRef.current = new (SQLRef.current as SqlJsStatic).Database();
    }
  }

  // Helper: sanitize table/column names to safe SQL identifiers
  function sanitizeIdentifier(s: string) {
    let name = s || "col";
    // remove BOM & trim
    name = name.replace(/^\uFEFF/, "").trim();
    // replace non-alphanumeric with underscore
    name = name.replace(/[^a-zA-Z0-9_]/g, "_");
    if (!name) name = "col";
    if (/^[0-9]/.test(name)) name = "_" + name;
    // limit length
    return name.slice(0, 60);
  }

  // Resolve duplicate names by appending _1, _2, ...
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

  // Minimal type inference across a sample of strings
  function inferColumnType(sampleValues: (string | null)[]) {
    // heuristics order: INTEGER -> REAL -> DATE -> TEXT
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
      // naive ISO date detection (YYYY-MM-DD or YYYY-MM-DDTHH:MM or similar)
      if (!/^\d{4}-\d{2}-\d{2}([T\s].*)?$/.test(s)) isDate = false;
      if (!isInt && !isReal && !isDate) break;
    }

    if (!anyNonNull) return "TEXT";
    if (isInt) return "INTEGER";
    if (isReal) return "REAL";
    if (isDate) return "TEXT"; // SQLite has no strict DATE type; store as TEXT or INTEGER epoch
    return "TEXT";
  }

  // Create a CREATE TABLE statement given sanitized column names and inferred types
  function createTableSQL(tableName: string, cols: string[], types: string[]) {
    const colsSql = cols.map((c, i) => `"${c.replace(/"/g, '""')}" ${types[i]}`).join(", ");
    return `CREATE TABLE IF NOT EXISTS "${tableName.replace(/"/g, '""')}" (${colsSql});`;
  }

  // Main importer
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    await ensureSqlJs();
    const db = dbRef.current!;
    setStatus("starting import...");

    for (const file of Array.from(files)) {
      const filenameBase = file.name.replace(/\.[^/.]+$/, "");
      let tableName = sanitizeIdentifier(filenameBase);
      // ensure unique table name inside DB
      const existingTables = db.exec(`SELECT name FROM sqlite_master WHERE type='table';`);
      const existingNames =
        existingTables && existingTables[0] ? existingTables[0].values.flat() : [];
      let idx = 1;
      while (existingNames.includes(tableName)) {
        tableName = `${sanitizeIdentifier(filenameBase)}_${idx++}`;
      }

      setStatus(`Parsing header of ${file.name}...`);

      // We'll collect a sample of rows (e.g. up to 1000 rows) to infer types.
      const SAMPLE_SIZE = 1000;
      const sampleRows: string[][] = [];
      let headersRaw: string[] | null = null;
      let parsedHeader = false;
      let aborted = false;

      // We'll insert in batches. If file is small we can parse fully; if large we'll stream.
      const batchSize = 500; // insert per batch
      let insertStmt: ReturnType<SqlJsDatabase["prepare"]> | null = null;
      let headerCols: string[] = [];

      // helper: perform actual table creation and statement preparation once we have sample
      function prepareTableFromSample() {
        // sanitize header names and ensure uniqueness
        const sanitized = (headersRaw || []).map((h) =>
          sanitizeIdentifier(h || "col")
        );
        const unique = uniqueNames(sanitized);
        headerCols = unique;

        // build sample array per column
        const samplesPerCol: (string | null)[][] = headerCols.map(() => []);
        for (const row of sampleRows) {
          for (let i = 0; i < headerCols.length; i++) {
            samplesPerCol[i].push(row[i] ?? null);
          }
        }
        const types = samplesPerCol.map((s) => inferColumnType(s));

        setTableTypes(prev => ({...prev, [tableName]: {
          columns: headerCols,
          types: types
        }}))

        // If many rows are numeric-looking but you want dates recognized as dates,
        // you can adapt inferColumnType to return TEXT with a DATE tag, or store canonical form.
        const createSQL = createTableSQL(tableName, headerCols, types);
        db.run("BEGIN TRANSACTION;");
        db.run(createSQL);
        db.run("COMMIT;");

        // prepare insert statement
        const colsQuoted = headerCols.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
        const placeholders = headerCols.map(() => "?").join(",");
        const insertSQL = `INSERT INTO "${tableName.replace(/"/g, '""')}" (${colsQuoted}) VALUES (${placeholders});`;
        insertStmt = db.prepare(insertSQL);
      }

      // batch runner: runs array of rows (rows are arrays aligned to headerCols)
      function runBatch(rows: (string | null)[]) {
        if (!insertStmt) throw new Error("Insert statement not prepared");
        for (const r of rows) {
          // if headerCols length may differ, pad or cut
          const values = (r as unknown as any[]).slice(0, headerCols.length).map((v) => {
            if (v === "") return null; // convert empty strings to NULL
            return v;
          });
          insertStmt.run(values);
        }
      }

      // We'll parse using PapaParse in step mode to support streaming large files:
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
            // results.data is an object keyed by header when header:true
            if (aborted) {
              parser.abort();
              reject(new Error("aborted"));
              return;
            }

            if (!parsedHeader) {
              // On the first step, we can access meta.fields to get header order
              headersRaw = results.meta.fields || null;
              parsedHeader = true;
            }

            // convert the object to array following header order
            const rowObj = results.data;
            const rowArr = (headersRaw || []).map((h) => {
              const v = rowObj[h];
              // ensure string (Papa may return numbers if dynamicTyping true; we set false)
              return v === undefined ? "" : String(v);
            });

            if (sampleRows.length < SAMPLE_SIZE) {
              sampleRows.push(rowArr);
            }

            rowsBuffer.push(rowArr);
            totalRows += 1;

            // If we've just filled our sample and haven't prepared the table, prepare it:
            if (sampleRows.length === SAMPLE_SIZE && !insertStmt) {
              prepareTableFromSample();
              // Insert sample into DB in a single transaction:
              db.run("BEGIN TRANSACTION;");
              try {
                runBatch(sampleRows);
                db.run("COMMIT;");
              } catch (err) {
                try { db.run("ROLLBACK;"); } catch(e){/*ignore*/ }
                parser.abort();
                reject(err);
                return;
              }
              // clear rowsBuffer since sample already inserted
              rowsBuffer = [];
              setStatus(`Imported ${sampleRows.length} sample rows for ${file.name}...`);
            }

            // When table is ready (insertStmt prepared), we can insert batches:
            if (insertStmt && rowsBuffer.length >= batchSize) {
              db.run("BEGIN TRANSACTION;");
              try {
                runBatch(rowsBuffer);
                db.run("COMMIT;");
                setStatus(`Imported ${totalRows} rows into "${tableName}" so far...`);
              } catch (err) {
                try { db.run("ROLLBACK;"); } catch(e){/*ignore*/ }
                parser.abort();
                reject(err);
                return;
              }
              rowsBuffer = [];
            }

            firstStep = false;
          },
          complete: function () {
            // parsing finished; if we never prepared insertStmt (small file), prepare now
            try {
              if (!parsedHeader) {
                // empty or invalid CSV
                setStatus(`No data in ${file.name}`);
                resolve();
                return;
              }
              if (!insertStmt) {
                // small file: infer from sampleRows and create table, then insert everything
                prepareTableFromSample();
                db.run("BEGIN TRANSACTION;");
                try {
                  runBatch(sampleRows);
                  db.run("COMMIT;");
                  setStatus(`Imported ${sampleRows.length} rows into "${tableName}" (small file).`);
                } catch (err) {
                  try { db.run("ROLLBACK;"); } catch(e){/*ignore*/ }
                  reject(err);
                  return;
                }
                resolve();
                return;
              }

              // Insert any remaining rowsBuffer
              if (rowsBuffer.length > 0) {
                db.run("BEGIN TRANSACTION;");
                try {
                  runBatch(rowsBuffer);
                  db.run("COMMIT;");
                  setStatus(`Imported ${totalRows} rows into "${tableName}".`);
                } catch (err) {
                  try { db.run("ROLLBACK;"); } catch(e){/*ignore*/ }
                  reject(err);
                  return;
                }
              }
              resolve();
            } catch (err) {
              reject(err);
            } finally {
              // free prepared statement
              try {
                if (insertStmt) {
                  insertStmt.free();
                }
              } catch (e) {}
            }
          },
          error: function (err) {
            aborted = true;
            reject(err);
          },
        });
      });

      // update table list state
      setTables((prev) => [...prev, tableName]);
      setStatus(`Completed import into table "${tableName}".`);
    } // for each file

    setStatus("all imports done");
  }



  // Small UI
  return (
    <div style={{ padding: 12, fontFamily: "system-ui, Arial" }}>
      <h3>CSV → sql.js importer</h3>
      <input
        type="file"
        accept=".csv,text/csv"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div style={{ marginTop: 8 }}>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Tables created:</strong>
        <ul>
          {tables.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 8 }}>
        <small>Notes: uses PapaParse streaming, infers basic column types from first 1000 rows.</small>
      </div>
      <div>
        <pre>{JSON.stringify(tableTypes, null, 2)}</pre>
      </div>
      <div>
        <input type="text" className="border border-black py-1.5 px-2.5 w-[600px]" value={userSQL} onChange={(event) => setUserSQL(event.target.value)} />
        <pre>{typeof(SQLResult) === "string" ? SQLResult : SQLResult.values.length}</pre>
      </div>
    </div>
  );
}
