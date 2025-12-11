import { useState, useEffect, useRef } from 'react'
import { usePage } from '../components/PageContext'
import Sidebar from '../components/Sidebar'
import Main from '../components/Main'
import SidebarHead from '../components/SidebarHead'
import Section from '../components/Section'
import { MapsArrow, Plus } from 'iconoir-react'
import SidebarSection from '../components/SidebarSection'
import SQLBuilder from '../components/SQLBuilder'
import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic, type QueryExecResult } from "sql.js";
import { DEFAULT_SELECT, handleFiles, IDB_STORE, openIndexedDB, savePageState, WASM_PATH, type Select, type TablesTypes } from "../util"
import ChartView, { type ScatterValue } from '../components/ChartView'
import TableView from '../components/TableView'
import ChartOptions from '../components/ChartOptions'


export default function ChartBuilderPage({ pageId }: { pageId: string }) {
  const { page, setPage } = usePage()
  const [isReady, setIsReady] = useState<boolean>(false)
  const [tables, setTables] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dbRef = useRef<SqlJsDatabase | null>(null);
  const SQLRef = useRef<SqlJsStatic | null>(null);
  const [tableTypes, setTableTypes] = useState<TablesTypes>({})
  const [userSQL, setUserSQL] = useState<string>("")
  const [userSelect, setUserSelect] = useState<Select>(structuredClone(DEFAULT_SELECT))
  const [SQLResult, setSQLREsult] = useState<QueryExecResult | null>(null)
  const [chartValues, setChartValues] = useState<ScatterValue[]>([])
  const [errMessage, setErrMessage] = useState("")
  const [label, setLabel] = useState<string>("") // SELECT DISTINCT column_name
  const [data, setData] = useState<string>("")

  const handleClick = () => {
    inputRef.current?.click();
  };

  async function ensureSqlJs() {
    if (!SQLRef.current) {
      const SQL = await initSqlJs({ locateFile: () => WASM_PATH });
      SQLRef.current = SQL;
    }
    if (!dbRef.current) {
      dbRef.current = new (SQLRef.current as SqlJsStatic).Database();
    }
  }

  async function loadPageState() {
    await ensureSqlJs();

    try {
      const idb = await openIndexedDB();
      const tx = idb.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(pageId);

      return new Promise<void>((resolve, reject) => {
        getReq.onsuccess = async () => {
          const value = getReq.result;
          idb.close();

          if (!value) {
            resolve();
            return;
          }

          setTables(value.tables);
          setTableTypes(value.tableTypes);
          setUserSQL(value.userSQL);
          setUserSelect(value.userSelect);

          if (value.dbBytes) {
            try {
              dbRef.current = new (SQLRef.current as SqlJsStatic).Database(value.dbBytes);
            } catch (err) {
              console.error("Failed to restore DB from IndexedDB:", err);
            }
          }
          resolve();
        };

        getReq.onerror = () => {
          idb.close();
          reject(getReq.error);
        };
      });
    } catch (err) {
      console.error("Failed to load page state from IndexedDB:", err);
    }
  }

  useEffect(() => {
    loadPageState()
  }, [])

  useEffect(() => {
    if (dbRef.current) {
      if (isReady) {
        savePageState(pageId, dbRef.current, tables, tableTypes, userSQL, userSelect)
      } else {
        setIsReady(true)
      }
    }
  }, [isReady, dbRef.current, tables, tableTypes, userSQL, userSelect])

  useEffect(() => {
    if (!userSQL || !dbRef.current) {
      setSQLREsult(null)
      return
    }
    try {
      const result: QueryExecResult[] = dbRef.current.exec(userSQL)
      setSQLREsult(result[0])
    } catch (error) {
      if (error instanceof Error) {
        setErrMessage(error.message)
      } else {
        setErrMessage(`Error: ${error}`)
      }
    }
  }, [userSQL])

  useEffect(() => {
    try {
      if (label && data && SQLResult) {
        const xI = SQLResult!.columns.indexOf(label)
        const yI = SQLResult!.columns.indexOf(data)
        if (xI < 0 || yI < 0) {
          setChartValues([])
        } else {
          setChartValues(SQLResult!.values.map(row => ({
            x: Number(row[xI]),
            y: Number(row[yI])
          })))
        }
      } else {
        setChartValues([])
      }
    } catch (error) { }
  }, [label, data, SQLResult])

  return (
    <div className='bg-stone-100 flex h-dvh w-dvw text-black'>
      <Sidebar>
        <SidebarHead>
          <a
            onClick={(event) => {
              event.preventDefault()
              setPage({ name: "report", id: "default" })
            }}
            href=""
            className='block group cursor-pointer visited:text-black text-black hover:text-gray-700 no-underline hover:underline transition-all duration-200'>
            <MapsArrow className='inline rotate-270 mr-[20px] ml-0 scale-x-100 group-hover:ml-[-10px] group-hover:mr-[30px] group-hover:scale-x-80 transition-all duration-200' />Back
          </a>
        </SidebarHead>
        <SidebarSection
          title="DataSource"
          items={tables}
          collapsable>
          <div
            onClick={handleClick}
            className='py-1 px-2 mx-auto text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
            <Plus className='inline' />
            <input
              className='hidden'
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={(e) => handleFiles(e.target.files, ensureSqlJs, dbRef.current!, () => { }, (t) => setTables(prev => [...prev, t]), (tt) => setTableTypes(prev => ({ ...prev, ...tt })))}
            />
          </div>
        </SidebarSection>
      </Sidebar>
      <Main>
        <Section>
          <h1>{page.id}</h1>
        </Section>
        <Section>
          <SQLBuilder select={userSelect} setSelect={setUserSelect} setSQL={setUserSQL} tables={tables} tablesTypes={tableTypes} />
        </Section>

        <Section>
          <ChartOptions
            columns={SQLResult ? SQLResult.columns : []}
            label={label}
            setLabel={setLabel}
            data={data}
            setData={setData} />
        </Section>

        <Section>
          <ChartView values={chartValues} />
        </Section>

        <Section>
          <TableView data={SQLResult ? SQLResult.values : []} columns={SQLResult ? SQLResult.columns : []} />
        </Section>
      </Main>
    </div>
  )
}
