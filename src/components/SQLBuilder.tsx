import React, { useState } from 'react'
import { NavArrowDown } from 'iconoir-react'



type Select = {
    FROM: string,
    ON: { left: string, right: string },
    JOIN: Select[],
    WHERE: { column: string, operation: string, value: string, value2?: string },
    GROUP_BY: string,
    HAVING: { fn: string, column: string, operation: string, value: string },
    ORDER_BY: { column: string, order: "ASC" | "DESC" }
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
            HAVING: { fn: "", column: "", operation: "", value: "" },
            ORDER_BY: { column: "col1", order: "ASC" }
        }
    ],
    WHERE: { column: "col1", operation: ">", value: "10" },
    GROUP_BY: "",
    HAVING: { fn: "", column: "", operation: "", value: "" },
    ORDER_BY: { column: "col2", order: "ASC" }
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

const FUNCTIONS = [
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    "COUNT",
    // COUNT(*),
    // Text / String:
    "MIN",
    "MAX",
    "COUNT",
    // Date / Time (stored as text, real, or integer in SQLite):
    "MIN",
    "MAX",
    "COUNT",
    // Boolean / Logical (SQLite has no strict boolean type):
    "SUM",
    "COUNT",

]

type HavingValue = { fn: string, column: string, operation: string, value: string }
type HavingOperationProps = {
    columns: string[],
    havingValue: HavingValue,
    setHavingValue: (v: HavingValue) => void
}
function HavingOperation(
    { columns, havingValue, setHavingValue }: HavingOperationProps
) {
    const [open, setOpen] = useState<null | "fn" | "column" | "operation">()
    return (
        <div className='relative flex w-[fit-content] border-1 border-gray-200 rounded-md'>
            <div className='absolute bg-white left-1/2 -translate-x-1/2 -top-[3px] h-[5px] rounded-md leading-1 text-gray-300 text-sm'>
                Having
            </div>

            <div onClick={() => setOpen(prev => prev === "fn" ? null : "fn")} className='py-2 px-3 text-nowrap w-[fit-content] cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {havingValue.fn ? havingValue.fn : "Function"} <NavArrowDown className='inline' />
            </div>

            <div onClick={() => setOpen(prev => prev === "column" ? null : "column")} className='py-2 px-3 text-nowrap w-[fit-content] cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {havingValue.column ? havingValue.column : "Column"} <NavArrowDown className='inline' />
            </div>

            <div onClick={() => setOpen(prev => prev === "operation" ? null : "operation")} className='py-2 px-3 text-nowrap w-[fit-content] cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {havingValue.operation ? havingValue.operation : "Operation"} <NavArrowDown className='inline' />
            </div>

            {!(havingValue.operation === "IS NULL" || havingValue.operation === "IS NOT NULL") && (
                <div className='rounded-md cursor-pointer transition-all duration-200'>
                    <input className='py-2 px-3 ring-1 w-[150px] ring-gray-200 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none rounded-md transition-all duration-200' type="text" value={havingValue.value} onChange={(e) => setHavingValue({ ...havingValue, value: e.target.value })} />
                </div>
            )}

            {open === "fn" && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {FUNCTIONS.map((fn, i) => (<div
                    onClick={() => {
                        setOpen(null)
                        setHavingValue({ ...havingValue, fn: fn })
                    }}
                    key={`${i}-${fn}`}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {fn}
                </div>))}
            </div>)}

            {open === "column" && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {columns.map((column, i) => (<div
                    onClick={() => {
                        setOpen(null)
                        setHavingValue({ ...havingValue, column: column })
                    }}
                    key={`${i}-${column}`}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {column}
                </div>))}
            </div>)}

            {open === "operation" && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {OPERATOINS.map((operation, i) => (<div
                    onClick={() => {
                        setOpen(null)
                        setHavingValue({ ...havingValue, operation: operation })
                    }}
                    key={`${i}-${operation}`}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {operation}
                </div>))}
            </div>)}
        </div>
    )
}


type GroupByOperationProps = {
    columns: string[],
    selectedColumn: string,
    setSelectedColumn: (c: string) => void
}
function GroupByOperation(
    { columns, selectedColumn, setSelectedColumn }: GroupByOperationProps
) {
    const [open, setOpen] = useState(false)
    return (
        <div className='relative flex w-[fit-content] border-1 border-gray-200 rounded-md'>
            <div className='absolute bg-white left-1/2 -translate-x-1/2 -top-[3px] h-[5px] rounded-md leading-1 text-gray-300 text-sm'>
                Group By
            </div>

            <div onClick={() => setOpen(prev => !prev)} className='py-2 px-3 text-nowrap w-[fit-content] cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedColumn ? selectedColumn : "Group By Column"} <NavArrowDown className='inline' />
            </div>

            {open && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {columns.map((column) => (<div
                    onClick={() => {
                        setOpen(false)
                        setSelectedColumn(column)
                    }}
                    key={column}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {column}
                </div>))}
            </div>)}
        </div>
    )
}


type OrderByOperationProps = {
    columns: string[],
    selectedColumn: { column: string, order: "ASC" | "DESC" },
    setSelectedColumn: (t: string, order: "ASC" | "DESC") => void
}

function OrderByOperation(
    { columns, selectedColumn, setSelectedColumn }: OrderByOperationProps
) {
    const [open, setOpen] = useState(false)

    return (
        <div className='relative flex w-[fit-content] border-1 border-gray-200 rounded-md'>
            <div className='absolute bg-white left-1/2 -translate-x-1/2 -top-[3px] h-[5px] rounded-md leading-1 text-gray-300 text-sm'>
                Order By
            </div>

            <div onClick={() => setOpen(prev => !prev)} className='py-2 px-3 text-nowrap w-[fit-content] cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedColumn.column ? selectedColumn.column : "Order By Column"} <NavArrowDown className='inline' />
            </div>

            <div onClick={() => setSelectedColumn(selectedColumn.column, "ASC")} className={'py-2 px-3 text-nowrap w-[fit-content] cursor-pointer hover:bg-stone-100 transition-all duration-200' + (selectedColumn.order === "ASC" ? " bg-stone-200" : " bg-white")}>
                ASC
            </div>
            <div onClick={() => setSelectedColumn(selectedColumn.column, "DESC")} className={'py-2 px-3 text-nowrap w-[fit-content] cursor-pointer hover:bg-stone-100 transition-all duration-200' + (selectedColumn.order === "DESC" ? " bg-stone-200" : " bg-white")}>
                DESC
            </div>

            {open && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {columns.map((column) => (<div
                    onClick={() => {
                        setOpen(false)
                        setSelectedColumn(column, selectedColumn.order)
                    }}
                    key={column}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {column}
                </div>))}
            </div>)}

        </div>
    )
}


type WhereCondition = { column: string, operation: string, value: string, value2?: string }
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
        <div className='relative flex w-[fit-content] border-1 border-gray-200 rounded-md'>
            <div className='absolute bg-white left-1/2 -translate-x-1/2 -top-[3px] h-[5px] rounded-md leading-1 text-gray-300 text-sm'>
                Where
            </div>

            <div onClick={() => setOpen(prev => prev === "column" ? null : "column")} className='py-2 px-3 text-nowrap rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedCondition.column ? selectedCondition.column : "Column"} <NavArrowDown className='inline' />
            </div>

            <div onClick={() => setOpen(prev => prev === "operation" ? null : "operation")} className='py-2 px-3 text-nowrap rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedCondition.operation ? selectedCondition.operation : "Operation"} <NavArrowDown className='inline' />
            </div>

            {!(selectedCondition.operation === "IS NULL" || selectedCondition.operation === "IS NOT NULL") && (
                <div className='rounded-md cursor-pointer bg-white transition-all duration-200'>
                    <input className='py-2 px-3 ring-1 w-[150px] ring-gray-200 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none rounded-md transition-all duration-200' type="text" value={selectedCondition.value} onChange={(e) => setSelectedCondition({ ...selectedCondition, value: e.target.value })} />
                </div>
            )}

            {selectedCondition.operation === "BETWEEN" && (
                <>
                    <div className='py-2 px-3 rounded-md cursor-pointer bg-white transition-all duration-200'>
                        AND
                    </div>
                    <div className='rounded-md cursor-pointer bg-white transition-all duration-200'>
                        <input className='py-2 px-3 ring-1 w-[150px] ring-gray-200 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none rounded-md transition-all duration-200' type="text" value={selectedCondition.value2} onChange={(e) => setSelectedCondition({ ...selectedCondition, value: e.target.value })} />
                    </div>
                </>
            )}

            {open === "column" && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
                {columns.map((column, i) => (<div
                    onClick={() => {
                        setOpen(null)
                        setSelectedCondition({ ...selectedCondition, column: column })
                    }}
                    key={`${i}-${column}`}
                    className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                    {column}
                </div>))}
            </div>)}

            {open === "operation" && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
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
        <div className='relative'>
            <div className='absolute bg-white left-1/2 -translate-x-1/2 -top-[3px] h-[5px] rounded-md leading-1 text-gray-300 text-sm'>
                From
            </div>

            <div onClick={() => setOpen(prev => !prev)} className='py-2 px-3 text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
                {selectedTable ? selectedTable : "From Table"} <NavArrowDown className='inline' />
            </div>
            {open && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
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

type SelectComponentProps = {
    level: number,
    select: Select,
    setSelect: (s: Partial<Select>) => void,
    tables: string[],
    columns: string[]
}
function SelectComponent({ level, select, setSelect, tables, columns }: SelectComponentProps) {
    return (
        <div className={`ml-${level} flex flex-row gap-2 flex-wrap`}>
            <FromOperation
                selectedTable={select.FROM}
                setSelectedTable={(table) => setSelect(({ FROM: table }))}
                tables={tables}
            />

            <WhereOperation
                colType="string"
                columns={columns}
                selectedCondition={select.WHERE}
                setSelectedCondition={(w: WhereCondition) => setSelect({ WHERE: w })}
            />

            <OrderByOperation
                columns={columns}
                selectedColumn={select.ORDER_BY}
                setSelectedColumn={(t, order) => setSelect({ ORDER_BY: { column: t, order: order } })}
            />

            <GroupByOperation
                columns={columns}
                selectedColumn={select.GROUP_BY}
                setSelectedColumn={(c) => setSelect({ GROUP_BY: c })}
            />

            <HavingOperation
                columns={columns}
                havingValue={select.HAVING}
                setHavingValue={(h) => setSelect({ HAVING: h })}
            />
        </div>
    )
}


export default function SQLBuilder() {
    const [select, setSelect] = useState<Select>(testSelect)
    const [tables, setTables] = useState<string[]>(["some_table", "other_table", "wrong_table"])
    const columns = ["col1", "col2", "col3"]

    return (
        <div className='flex flex-col gap-4'>
            <SelectComponent
                level={1}
                select={select}
                setSelect={(s) => setSelect(prev => ({ ...prev, ...s }))}
                tables={tables}
                columns={columns}
            />
        </div>
    )
}
