import React, { useState } from 'react'
import { usePage } from '../components/PageContext'
import Sidebar from '../components/Sidebar'
import Main from '../components/Main'
import SidebarHead from '../components/SidebarHead'
import Section from '../components/Section'
import { MapsArrow, NavArrowDown } from 'iconoir-react'
import SidebarSection from '../components/SidebarSection'
import SQLBuilder from '../components/SQLBuilder'


export default function ReportPage() {
  const { page, setPage } = usePage()
  const [sql, setSQL] = useState("")

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
          items={['some_data_file.csv', 'some_data_file.csv', 'some_data_file.csv']}
          collapsable
        />
      </Sidebar>
      <Main>
        <Section>
          <h1>{page.id}</h1>
        </Section>
        <Section>
          <SQLBuilder setSQL={setSQL} />
        </Section>
      </Main>
    </div>
  )
}
