import { NavArrowDown } from 'iconoir-react'
import React, { useState } from 'react'
import { type Database } from "sql.js";


type ChartOptionsProps = {
  columns: string[], 
  label: string,
  setLabel: React.Dispatch<React.SetStateAction<string>>,
  data: string,
  setData: React.Dispatch<React.SetStateAction<string>>,
}
export default function ChartOptions({ 
  columns, 
  label,
  setLabel,
  data,
  setData 
}: ChartOptionsProps) {
  const [open, setOpen] = useState<'label' | 'data' | null>(null)

  return (
    <div className='flex flex-row gap-2'>
      <div className='relative'>
        <div className='absolute bg-white left-1/2 -translate-x-1/2 -top-[3px] h-[5px] rounded-md leading-1 text-gray-300 text-sm whitespace-nowrap'>
          Label
        </div>

        <div onClick={() => setOpen(prev => prev === 'label' ? null : 'label')}
          className='py-2 px-3 text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
          {label ? label : "data"} <NavArrowDown className='inline' />
        </div>
        {open === "label" && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
          {columns.filter((col) => col !== data).map((col) => (<div
            onClick={() => {
              setOpen(null)
              setLabel(col)
            }}
            key={col}
            className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
            {col}
          </div>))}
        </div>)}
      </div>
      <div className='relative'>
        <div className='absolute bg-white left-1/2 -translate-x-1/2 -top-[3px] h-[5px] rounded-md leading-1 text-gray-300 text-sm whitespace-nowrap'>
          Data
        </div>

        <div onClick={() => setOpen(prev => prev === 'data' ? null : 'data')} className='py-2 px-3 text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
          {data ? data : "Data"} <NavArrowDown className='inline' />
        </div>
        {open === "data" && (<div className='z-1 absolute overflow-hidden top-[100%] mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
          {columns.filter((col) => col !== label).map((col) => (<div
            onClick={() => {
              setOpen(null)
              setData(col)
            }}
            key={col}
            className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
            {col}
          </div>))}
        </div>)}
      </div>
    </div>
  )
}
