import { type ReactNode } from 'react'
import { NavArrowLeft } from 'iconoir-react'


export default function SidebarSection({ children, title, items, collapsable = false }: { children?: ReactNode, title: string, items: string[], collapsable?: boolean }) {
    return (
        <div className='border-b-2 border-gray-200 py-5'>
            <div className={`px-4 pb-3 group` + collapsable ? " cursor-pointer" : ""}>
                {collapsable && <NavArrowLeft className='inline pb-[3px] mr-3 rotate-0 group-hover:-rotate-90 transition-all duration-200' />}{title}
            </div>
            {/* <div className='overflow-hidden max-h-[1080px] scroll-hidden transition-all duration-400 hover:max-h-0'> */}
            <div className='overflow-hidden max-h-[1080px] scroll-hidden transition-all duration-400'>
                {items.map((item, i) => (<div key={`${i}-${item}`} className='px-5 py-2 relative'>
                    {/* <div className='absolute h-full w-[4px] bg-black left-0 rounded-r-md'></div> */}
                    <p className='text-nowrap overflow-x-scroll scroll-hidden'>{item}</p>
                </div>))}
                {children}
            </div>
        </div>
    )
}
