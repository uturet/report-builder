import Papa from "papaparse";
import type { Database as SqlJsDatabase } from "sql.js";
import type { Select } from "./components/SQLBuilder";

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


export function selectToSQL(node: Select): string {
  const lit = (v: string) => {
    if (v === null || v === undefined) return "NULL";
    if (/^-?\d+(\.\d+)?$/.test(v)) return v;
    return `'${v.replace(/'/g, "''")}'`;
  };

  const buildWhere = (w: Select["WHERE"] | undefined): string => {
    if (!w) return "";
    const c = (w.column ?? "").trim();
    const op = (w.operation ?? "").trim();
    const val = (w.value ?? "").trim();
    if (!c || !op) return "";
    if (op.toUpperCase() === "BETWEEN" && w.value2 !== undefined && w.value2 !== "") {
      return `WHERE ${c} BETWEEN ${lit(val)} AND ${lit((w.value2 ?? "").toString())}`;
    }
    if (op.toUpperCase() === "IN") {
      const items = val.split(",").map(s => s.trim()).filter(Boolean).map(lit).join(", ");
      return items ? `WHERE ${c} IN (${items})` : "";
    }
    if (val === "") return `WHERE ${c} ${op}`;
    return `WHERE ${c} ${op} ${lit(val)}`;
  };

  const buildHaving = (h: Select["HAVING"] | undefined): string => {
    if (!h) return "";
    const fn = (h.fn ?? "").trim();
    const col = (h.column ?? "").trim();
    const op = (h.operation ?? "").trim();
    const val = (h.value ?? "").trim();
    if (!fn || !col || !op) return "";
    return `HAVING ${fn}(${col}) ${op} ${lit(val)}`;
  };

  const joinClauses: string[] = [];
  const orderBys: { column: string, order: "ASC" | "DESC" }[] = [];

  function walkJoins(current: Select) {
    if (current.ORDER_BY && current.ORDER_BY.column?.trim()) {
      orderBys.push({ column: current.ORDER_BY.column.trim(), order: current.ORDER_BY.order });
    }

    for (const j of current.JOIN || []) {
      if (!j.FROM) continue;
      const onL = (j.ON?.left ?? "").trim();
      const onR = (j.ON?.right ?? "").trim();
      const onClause = (onL && onR) ? ` ON ${onL} = ${onR}` : "";
      joinClauses.push(`JOIN ${j.FROM}${onClause}`);
      walkJoins(j);
    }
  }

  if (node.ORDER_BY && node.ORDER_BY.column?.trim()) {
    orderBys.push({ column: node.ORDER_BY.column.trim(), order: node.ORDER_BY.order });
  }

  const fromPart = `FROM ${node.FROM}`;

  walkJoins(node);

  const wherePart = buildWhere(node.WHERE);

  const groupByPart = node.GROUP_BY && node.GROUP_BY.trim() ? `GROUP BY ${node.GROUP_BY.trim()}` : "";
  const havingPart = buildHaving(node.HAVING);

  const seen = new Set<string>();
  const orderList = orderBys
    .filter(ob => {
      const key = `${ob.column} ${ob.order}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(ob => `${ob.column} ${ob.order}`);

  const orderPart = orderList.length ? `ORDER BY ${orderList.join(", ")}` : "";

  const parts = [
    "SELECT *",
    fromPart,
    ...joinClauses,
    wherePart,
    groupByPart,
    havingPart,
    orderPart
  ].filter(Boolean);

  return parts.join("\n");
}


export type Select = {
  FROM: string,
  ON: { left: string, right: string },
  JOIN: Select[],
  WHERE: { column: string, operation: string, value: string, value2?: string },
  GROUP_BY: string,
  HAVING: { fn: string, column: string, operation: string, value: string },
  ORDER_BY: { column: string, order: "ASC" | "DESC" }
}

export const DEFAULT_SELECT: Select = {
  FROM: "",
  ON: { left: "", right: "" },
  JOIN: [],
  WHERE: { column: "", operation: "", value: "" },
  GROUP_BY: "",
  HAVING: { fn: "", column: "", operation: "", value: "" },
  ORDER_BY: { column: "", order: "ASC" }
}



export const WASM_PATH = "/sql-wasm.wasm"

export const IDB_DB_NAME = "sqljs-pages";
export const IDB_STORE = "pages";

export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains(IDB_STORE)) {
        idb.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn("IndexedDB open blocked");
  });
}

export async function savePageState(pageId: string, db: SqlJsDatabase, tables: string[], tableTypes: TablesTypes, userSQL: string, userSelect: Select) {
  try {
    const idb = await openIndexedDB();
    const tx = idb.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);

    let exported: Uint8Array | null = null;
    try {
      if (db) exported = db.export();
    } catch (err) {
      console.warn("Failed to export DB for saving:", err);
    }

    const toStore = {
      pageId,
      dbBytes: exported,
      tables,
      tableTypes,
      userSQL,
      userSelect,
      savedAt: Date.now(),
    };

    store.put(toStore, pageId);

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onabort = () => {
        idb.close();
        reject(tx.error);
      };
      tx.onerror = () => {
        idb.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.error("Failed to save page state to IndexedDB:", err);
  }
}
