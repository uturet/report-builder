import React from 'react'
import { usePage } from '../components/PageContext'
import Sidebar from '../components/Sidebar'
import Main from '../components/Main'
import SidebarHead from '../components/SidebarHead'
import Section from '../components/Section'
import { Download } from 'iconoir-react'
import SidebarSection from '../components/SidebarSection'

export default function ReportPage() {
  const {page, setPage} = usePage()

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
        <Section onClick={() => setPage({name: 'chart-builder', id: 'Amazing Chart'})}>
          Click ME
        </Section>
      </Main>
    </div>
  )
}
