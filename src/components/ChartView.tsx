import {
  Chart as ChartJS,
  PointElement,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'

ChartJS.register(PointElement, LinearScale, Tooltip, Legend)

export type ScatterValue = { x: number, y: number }
type ChartViewProps = { values: ScatterValue[] }
export default function ChartView({ values }: ChartViewProps) {
  const data = {
    datasets: [
      {
        label: 'Scatter Points',
        data: values,
        backgroundColor: 'rgb(255,99,132)'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false
  }

  return (
    <div style={{ height: '350px' }}>
      <Scatter data={data} options={options} />
    </div>
  )
}