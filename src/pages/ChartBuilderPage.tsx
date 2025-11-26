import React from 'react'
import { usePage } from '../components/PageContext'


export default function ChartBuilderPage() {
  const {setPage} = usePage() 

  return (
    <div onClick={() => setPage('report')}>
      ChartBuilderPage
    </div>
  )
}
