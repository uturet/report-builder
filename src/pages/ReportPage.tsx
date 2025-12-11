import React, { useState } from 'react'
import { usePage } from '../components/PageContext'
import Sidebar from '../components/Sidebar'
import Main from '../components/Main'
import SidebarHead from '../components/SidebarHead'
import Section from '../components/Section'
import { Download } from 'iconoir-react'
import SidebarSection from '../components/SidebarSection'
import uuid4 from 'uuid4'
import ChartView from '../components/ChartView'
import TextEditor from '../components/TextEditor'

type ReportItem = {
  id: string,
  type: "TextEditor" | "Chart",
  value: any
}
export default function ReportPage() {
  const { page, setPage } = usePage()
  const [reportData, setReportData] = useState<ReportItem[]>([])

  return (
    <div className='bg-stone-100 flex h-dvh w-dvw text-black'>
      <Sidebar>
        <SidebarHead>
          <a
            href=""
            className='block group cursor-pointer visited:text-black text-black hover:text-gray-700 no-underline hover:underline transition-all duration-200'>
            <Download className='inline mr-[20px] ml-0 scale-x-100 group-hover:scale-y-120 transition-all duration-200' />Export
          </a>
        </SidebarHead>
        <SidebarSection
          title="Report List"
          items={['some_data_file.csv', 'some_data_file.csv', 'some_data_file.csv']}
        />
      </Sidebar>
      <Main>
        <Section onClick={() => setPage({ name: 'chart-builder', id: 'Amazing Chart' })}>
          Click ME
        </Section>

        {reportData.map(r => {
          if (r.type === "TextEditor") return (<Section key={r.id}>
            <TextEditor value={r.value} onChange={v => setReportData(prev => [...prev.filter(s => s.id !== r.id), { ...prev.filter(s => s.id === r.id)[0], value: v }])} />
          </Section>)
          if (r.type === "Chart") return (<Section key={r.id} onClick={() => setPage({ name: 'chart-builder', id: r.id })}>
            <ChartView values={r.value} />
          </Section>)
        })}

        <div className='flex flex-row gap-2 justify-center'>
          <div className='relative'>
            <div onClick={() => setReportData(prev => [...prev, { id: uuid4(), type: "TextEditor", value: "" }])}
              className='py-2 px-3 text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
              TextEditor
            </div>

          </div>
          <div className='relative'>
            <div onClick={() => setReportData(prev => [...prev, { id: uuid4(), type: "Chart", value: [] }])}
              className='py-2 px-3 text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
              Chart
            </div>
          </div>
        </div>
      </Main>
    </div>
  )
}
