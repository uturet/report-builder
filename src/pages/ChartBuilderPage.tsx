import { useState, useEffect, useRef } from 'react'
import { usePage } from '../components/PageContext'
import Sidebar from '../components/Sidebar'
import Main from '../components/Main'
import SidebarHead from '../components/SidebarHead'
import Section from '../components/Section'
import { MapsArrow, NavArrowDown, Plus } from 'iconoir-react'
import SidebarSection from '../components/SidebarSection'
import SQLBuilder from '../components/SQLBuilder'
import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic, type QueryExecResult } from "sql.js";
import { handleFiles, type TablesTypes } from "../util"


const WASM_PATH = "/sql-wasm.wasm"


export default function ReportPage() {
  const { page, setPage } = usePage()
  const [status, setStatus] = useState<string>("idle");
  const [tables, setTables] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dbRef = useRef<SqlJsDatabase | null>(null);
  const SQLRef = useRef<SqlJsStatic | null>(null);
  const [tableTypes, setTableTypes] = useState<TablesTypes>({})
  const [userSQL, setUserSQL] = useState<string>("")
  const [SQLResult, setSQLREsult] = useState<string>("")

  const handleClick = () => {
    inputRef.current?.click();
  };

  async function ensureSqlJs() {
    if (!SQLRef.current) {
      setStatus("loading sql.js...");
      const SQL = await initSqlJs({ locateFile: () => WASM_PATH });
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
              onChange={(e) => handleFiles(e.target.files, ensureSqlJs, dbRef.current!, () => setStatus("Invalid file"), (t) => setTables(prev => [...prev, t]), (tt) => setTableTypes(prev => ({ ...prev, ...tt })))}
            />
          </div>
        </SidebarSection>
      </Sidebar>
      <Main>
        <Section>
          <h1>{page.id}</h1>
        </Section>
        <Section>
          <SQLBuilder setSQL={setUserSQL} tables={tables} tablesTypes={tableTypes} />
        </Section>
      </Main>
    </div>
  )
}
