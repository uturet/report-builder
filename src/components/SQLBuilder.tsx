import React, { useState } from 'react'
import { NavArrowDown } from 'iconoir-react'


type Select = {
    FROM: string,
    ON?: { left: string, right: string },
    JOIN?: Select[],
    WHERE?: { column: string, operation: string, value: string },
    GROUP_BY?: string,
    HAVING?: string,
    ORDER_BY?: "ASC" | "DESC"
}


const testSelect: Select = {
    FROM: "some_table",
    ON: { left: "", right: "" },
    JOIN: [
        {
            FROM: "other_table",
            ON: { left: "", right: "" },
            JOIN: [],
            WHERE: { column: "col2", operation: ">", value: "10" },
            GROUP_BY: "",
            HAVING: "",
            ORDER_BY: "ASC"
        }
    ],
    WHERE: { column: "col1", operation: ">", value: "10" },
    GROUP_BY: "",
    HAVING: "",
    ORDER_BY: "ASC"
}

const OPERATOINS = [
    // 1. Numeric columns (INT, FLOAT, DECIMAL, etc.)
    "=",
    "!=",
    "<>",
    ">",
    ">=",
    "<",
    "<=",
    "BETWEEN",
    "IN",
    "IS NULL",
    "IS NOT NULL",
    // 2. Text / String columns (CHAR, VARCHAR, TEXT)
    "=",
    "!=",
    "<>",
    "LIKE",
    "GLOB",
    "IN",
    "IS NULL",
    "IS NOT NULL",
    "<",
    ">",
    "<=",
    ">=",
    // 3. Date / Time columns (DATE, DATETIME, TIMESTAMP)
    "=",
    "!=",
    "<>",
    ">",
    ">=",
    "<",
    "<=",
    "BETWEEN",
    "IN",
    "IS NULL",
    "IS NOT NULL",
    // 4. Boolean / Logical columns (SQLite uses 0/1)
    "=",
    "!=",
    "<>",
    "IS",
    "IS NOT",
    // 5. Combined / Logical Operators (any type)
    "AND",
    "OR",
    "NOT",
]

type WhereCondition = { column: string, operation: string, value: string }
type WhereOperationProps = {
    colType: string,
    columns: string[],
    selectedCondition: WhereCondition,
    setSelectedCondition: (w: WhereCondition) => void
}

function WhereOperation(
    { colType, columns, selectedCondition, setSelectedCondition }: WhereOperationProps
) {
    const [open, setOpen] = useState<null | "column" | "operation">()

    return (
        <div className='relative z-1 flex w-[fit-content] border-1 border-gray-200 rounded-md'>
            <div onClick={() => setOpen(prev => prev === "operation" ? null : "column")} className='py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedCondition.column ? selectedCondition.column : "Column"} <NavArrowDown className='inline' />
            </div>

            <div onClick={() => setOpen(prev => prev === "column" ? null : "operation")} className='py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedCondition.operation ? selectedCondition.operation : "Operation"} <NavArrowDown className='inline' />
            </div>

            <div className='py-2 px-3 rounded-md cursor-pointer bg-white transition-all duration-200'>
                <input type="text" value={selectedCondition.value} onChange={(e) => setSelectedCondition({ ...selectedCondition, value: e.target.value })} />
            </div>

            {open === "column" && (<div className='absolute overflow-hidden mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {columns.map((column) => (<div
                    onClick={() => {
                        setOpen(null)
                        setSelectedCondition({ ...selectedCondition, column: column })
                    }}
                    key={column}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {column}
                </div>))}
            </div>)}

            {open === "operation" && (<div className='absolute overflow-hidden mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {OPERATOINS.map((operation, i) => (<div
                    onClick={() => {
                        setOpen(null)
                        setSelectedCondition({ ...selectedCondition, operation: operation })
                    }}
                    key={`${i}-${operation}`}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {operation}
                </div>))}
            </div>)}

        </div>
    )
}


type FromOperationProps = {
    tables: string[],
    selectedTable: string,
    setSelectedTable: (t: string) => void
}

function FromOperation(
    { tables, selectedTable, setSelectedTable }: FromOperationProps
) {
    const [open, setOpen] = useState(false)

    return (
        <div className='relative z-1'>
            <div onClick={() => setOpen(prev => !prev)} className='py-2 px-3 w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedTable ? selectedTable : "From Table"} <NavArrowDown className='inline' />
            </div>
            {open && (<div className='absolute overflow-hidden mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {tables.map((table) => (<div
                    onClick={() => {
                        setOpen(false)
                        setSelectedTable(table)
                    }}
                    key={table}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {table}
                </div>))}
            </div>)}
        </div>
    )
}


export default function SQLBuilder() {
    const [select, setSelect] = useState<Select>(testSelect)
    const [tables, setTables] = useState<string[]>(["some_table", "other_table", "wrong_table"])

    return (
        <div className='flex flex-row gap-1'>
            <FromOperation
                selectedTable={select.FROM}
                setSelectedTable={(table) => setSelect(prev => ({ ...prev, FROM: table }))}
                tables={tables} />

            {select.WHERE && <WhereOperation
                colType="string"
                columns={["col1", "col2", "col3"]}
                selectedCondition={select.WHERE}
                setSelectedCondition={(w: WhereCondition) => setSelect((prev: Select) => ({ ...prev, WHERE: w }))} />}

        </div>
    )
}
