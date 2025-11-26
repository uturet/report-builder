import React, { type ReactNode } from 'react'
import { NavArrowDown } from 'iconoir-react'

export default function Section({children, onClick}: {children?: ReactNode, onClick?: () => void}) {

    return (
        <section onClick={() => onClick?.()} className={`rounded-xl max-w-[800px] w-full h-[fit-content] shadow-xs border-1 border-gray-200 p-8` + onClick ? " cursor-pointer": ""}>
            {children}
        </section>
    )
}
