import React, { type ReactNode } from 'react'


export default function Main({children, ref}: {children: ReactNode, ref?: React.RefObject<HTMLDivElement | null>}) {
    return (
        <main ref={ref} className="h-lvh w-lvw flex-1 p-1">
            <div className='bg-white rounded-xl overflow-y-scroll w-full h-full py-16 shadow-xs border-1 border-gray-200 flex flex-col gap-2 items-center'>
                
                {children}

            </div>
        </main>
    )
}
