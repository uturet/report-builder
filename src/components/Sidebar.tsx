import React from 'react'
import { MapsArrow, NavArrowLeft } from 'iconoir-react'
import { usePage } from './PageContext'


export default function Sidebar() {
    const { setPage } = usePage();

    return (
        <aside className='w-[256px] h-lvh'>

            <div className='border-b-2 border-gray-200 p-5'>
                <a 
                    onClick={() => setPage('report')}
                    href="" 
                    className='block group cursor-pointer visited:text-black text-black hover:text-gray-700 no-underline hover:underline transition-all duration-200'>
                    <MapsArrow className='inline rotate-270 mr-[20px] ml-0 scale-x-100 group-hover:ml-[-10px] group-hover:mr-[30px] group-hover:scale-x-80 transition-all duration-200' />Back
                </a>
            </div>

            <div className='border-b-2 border-gray-200 py-5'>
                <div className='px-4 pb-3 group cursor-pointer'>
                    <NavArrowLeft className='inline pb-[3px] rotate-0 group-hover:-rotate-90 transition-all duration-200' /> DataSource
                </div>
                <div className='overflow-hidden max-h-[1080px] scroll-hidden transition-all duration-400 hover:max-h-0'>
                    <div className='px-5 py-2 relative'>
                        {/* <div className='absolute h-full w-[4px] bg-black left-0 rounded-r-md'></div> */}
                        <p className='text-nowrap overflow-x-scroll scroll-hidden'>
                            some_data_file.csv some_data_file.csvsome_data_file.csvsome_data_file.csvsome_data_file.csv
                        </p>
                    </div>
                </div>
            </div>

        </aside>
    )
}
