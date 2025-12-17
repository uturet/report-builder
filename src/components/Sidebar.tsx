import {type ReactNode} from 'react'
import { usePage } from './PageContext'


export default function Sidebar({children}: {children: ReactNode}) {
    // @ts-ignore
    const { setPage } = usePage();

    return (
        <aside className='w-[256px] h-lvh'>

            {children}

        </aside>
    )
}
