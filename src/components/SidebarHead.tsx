import { type ReactNode } from 'react'

export default function SidebarHead({children}: {children: ReactNode}) {
  return (
    <div className='border-b-2 border-gray-200 p-5'>
        {children}
    </div>
  )
}
