import { NavArrowDown } from 'iconoir-react'
import React from 'react'

export default function Main() {
    return (
        <main className="h-lvh w-lvw flex-1 p-1">
            <div className='bg-white rounded-xl w-full h-full py-16 shadow-xs border-1 border-gray-200 flex justify-center'>
                
                <section className='rounded-xl max-w-[800px] w-full h-[fit-content] shadow-xs border-1 border-gray-200 p-8'>
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
                </section>

            </div>
        </main>
    )
}
