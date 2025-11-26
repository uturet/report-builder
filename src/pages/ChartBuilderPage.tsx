import React from 'react'
import { usePage } from '../components/PageContext'
import Sidebar from '../components/Sidebar'
import Main from '../components/Main'
import SidebarHead from '../components/SidebarHead'
import Section from '../components/Section'
import { MapsArrow, NavArrowDown } from 'iconoir-react'
import SidebarSection from '../components/SidebarSection'


export default function ReportPage() {
  const { page, setPage } = usePage()

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
          <div className='relative'>
            <div className='py-2 px-3 w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
              Options <NavArrowDown className='inline' />
            </div>
            <div className='absolute overflow-hidden mt-1 bg-white border-1 border-gray-200 rounded-md w-[200px] shadow-md max-h-[500px] scroll-hidden transition-all duration-400 active:max-h-0 active:border-0'>
              <div className='px-3 py-2 cursor-pointer hover:bg-stone-100 active:bg-stone-200 text-nowrap overflow-x-hidden transition-all duration-200'>
                some_data_file.csv
              </div>
            </div>
          </div>
        </Section>
      </Main>
    </div>
  )
}
