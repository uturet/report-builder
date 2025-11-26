import React from 'react'
import { usePage } from '../components/PageContext'


export default function ReportPage() {
  const {setPage} = usePage()

  return (
    <div onClick={() => setPage('chart-builder')}>
      ReportPage
    </div>
  )
}
