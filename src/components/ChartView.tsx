import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
)

export default function LineChart() {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [10, 20, 15, 40, 30, 50],
        borderWidth: 2,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(250, 250, 250, 0.3)',
        tension: 0.3
      },
      {
        label: 'Sales2',
        data: [20, 15, 40, 30, 50, 40],
        borderWidth: 2,
        borderColor: 'rgb(224, 211, 156)',
        backgroundColor: 'rgba(189, 171, 122, 0.3)',
        tension: 0.3
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  }

  return (
    <div style={{ height: '350px' }}>
      <Line  data={chartData} options={chartOptions} />
    </div>
  )
}
