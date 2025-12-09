import { useState, useRef, useEffect } from "react";
import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic, type QueryExecResult } from "sql.js";
import { handleFiles, type TablesTypes } from "../util"


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
  const [userSQL, setUserSQL] = useState<string>("")
  const [SQLResult, setSQLREsult] = useState<string>("")


  async function ensureSqlJs() {
    if (!SQLRef.current) {
      setStatus("loading sql.js...");
      const SQL = await initSqlJs({ locateFile: () => wasmPath });
      SQLRef.current = SQL;
      setStatus("sql.js loaded");
    }
    if (!dbRef.current) {
      dbRef.current = new (SQLRef.current as SqlJsStatic).Database();
    }
  }

  useEffect(() => {
    ensureSqlJs()
  }, [])

  useEffect(() => {
    if (!userSQL || !dbRef.current) {
      setSQLREsult("")
      return
    }
    try {
      const result: QueryExecResult[] = dbRef.current.exec(userSQL)
      setSQLREsult(JSON.stringify(result[0], null, 2))
    } catch (error) {
      if (error instanceof Error) {
        setSQLREsult(error.message)
      } else {
        setSQLREsult(`Error: ${error}`)
      }
    }
  }, [userSQL])


  return (
    <div style={{ padding: 12, fontFamily: "system-ui, Arial" }}>
      <h3>CSV → sql.js importer</h3>
      <input
        type="file"
        accept=".csv,text/csv"
        multiple
        onChange={(e) => handleFiles(e.target.files, ensureSqlJs, dbRef.current!, () => setStatus("Invalid file"), (t) => setTables(prev => [...prev, t]), (tt) => setTableTypes(prev => ({ ...prev, ...tt })))}
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
          <pre>{typeof (SQLResult) === "string" ? SQLResult : SQLResult.values.length}</pre>
        </div>
    </div>
  );
}
