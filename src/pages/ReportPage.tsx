import { usePage, type ChartValuesType } from '../components/PageContext'
import Sidebar from '../components/Sidebar'
import Main from '../components/Main'
import SidebarHead from '../components/SidebarHead'
import Section from '../components/Section'
import { Download } from 'iconoir-react'
import SidebarSection from '../components/SidebarSection'
import uuid4 from 'uuid4'
import ChartView from '../components/ChartView'
import TextEditor from '../components/TextEditor'
import { DEFAULT_SELECT } from '../util'
import { useReportData } from '../components/ReportDataContext'
import { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'


export default function ReportPage() {
  const { page, setPage } = usePage()
  const { reportData, setReportData } = useReportData()
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    if (!exportRef.current) return;

    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save("export.pdf");
  };

  return (
    <div className='bg-stone-100 flex h-dvh w-dvw text-black'>
      <Sidebar>
        <SidebarHead>
          <a
            onClick={handleExport}
            className='block group cursor-pointer visited:text-black text-black hover:text-gray-700 no-underline hover:underline transition-all duration-200'>
            <Download className='inline mr-[20px] ml-0 scale-x-100 group-hover:scale-y-120 transition-all duration-200' />Export
          </a>
        </SidebarHead>
        <SidebarSection
          title="Report List"
          items={['some_data_file.csv', 'some_data_file.csv', 'some_data_file.csv']}
        />
      </Sidebar>
      <Main ref={exportRef}>
        <h1 className='text-3xl font-semibold'>Report {page.id}</h1>
        {reportData.sort((rc, rn) => rc.i - rn.i).map(r => {
          if (r.type === "TextEditor") return (<Section key={r.id}>
            <TextEditor value={r.value as string} onChange={v => setReportData(prev => [...prev.filter(s => s.id !== r.id), { ...prev.filter(s => s.id === r.id)[0], value: v }])} />
          </Section>)
          if (r.type === "Chart") {
            const v = r.value as ChartValuesType;
            return (<Section key={r.id} onClick={() => setPage({
            name: 'chart-builder', id: r.id, props: { chartValues: v, reportId: page.id, setChartValues: (v) => setReportData(prev => [...prev.filter(s => s.id !== r.id), { ...prev.filter(s => s.id === r.id)[0], value: v }]) }
          })}>
            <ChartView values={v.chartValues} />
          </Section>)
        }})}

        <div className='flex flex-row gap-2 justify-center'>
          <div className='relative'>
            <div onClick={() => setReportData(prev => [...prev, { i: prev.length, id: uuid4(), type: "TextEditor", value: "" }])}
              className='py-2 px-3 text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
              TextEditor
            </div>

          </div>
          <div className='relative'>
            <div onClick={() => setReportData(prev => [...prev, {i: prev.length, id: uuid4(), type: "Chart", value: { chartValues: [], userSQL: "", userSelect: structuredClone(DEFAULT_SELECT), label: "", data: "" } }])}
              className='py-2 px-3 text-nowrap w-[fit-content] border-1 border-gray-200 rounded-md cursor-pointer bg-white hover:bg-stone-100 active:bg-stone-200 transition-all duration-200'>
              Chart
            </div>
          </div>
        </div>
      </Main>
    </div>
  )
}
