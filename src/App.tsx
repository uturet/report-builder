import { useState } from 'react'
import { MapsArrow, NavArrowLeft, NavArrowDown } from 'iconoir-react'

function App() {

  return (
    <div className='bg-stone-100 flex h-dvh w-dvw text-black'>
      <aside className='w-[256px] h-lvh'>

        <div className='border-b-2 border-gray-200 p-5'>
          <a href="#" className='block group cursor-pointer visited:text-black text-black hover:text-gray-700 no-underline hover:underline transition-all duration-200'>
            <MapsArrow className='inline rotate-270 mr-[20px] ml-0 scale-x-100 group-hover:ml-[-10px] group-hover:mr-[30px] group-hover:scale-x-80 transition-all duration-200' />Back
          </a>
        </div>
        
        <div className='border-b-2 border-gray-200 py-5'>
          <div className='px-4 pb-3 group cursor-pointer'>
              <NavArrowLeft className='inline pb-[3px] rotate-0 group-hover:-rotate-90 transition-all duration-200'/> DataSource
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
    </div>
  )
}

export default App
