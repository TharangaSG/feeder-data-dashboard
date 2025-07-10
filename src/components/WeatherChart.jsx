import React, { useEffect, useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const WeatherChart = ({ data }) => {
  const [chartKey, setChartKey] = useState(0)
  
  // Force chart re-render when data changes
  useEffect(() => {
    setChartKey(prev => prev + 1)
  }, [data])

  // Memoize chart data to prevent unnecessary re-calculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    return {
      labels: data.map(item => item.time),
      datasets: [
        {
          label: 'Temperature',
          data: data.map(item => item.temperature),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y',
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          tension: 0.4,
        },
        {
          label: 'Humidity',
          data: data.map(item => item.humidity),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y1',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          tension: 0.4,
        },
        {
          label: 'Pressure',
          data: data.map(item => item.pressure),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y1',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          tension: 0.4,
        },
      ],
    }
  }, [data])
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Real-time Weather Data',
        color: 'white',
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label
            const value = context.parsed.y
            
            if (datasetLabel === 'Temperature') {
              return `Temperature: ${value.toFixed(1)}°C`
            } else if (datasetLabel === 'Humidity') {
              return `Humidity: ${value.toFixed(1)}%`
            } else if (datasetLabel === 'Pressure') {
              return `Pressure: ${value.toFixed(1)} hPa`
            }
            return `${datasetLabel}: ${value.toFixed(1)}`
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: 'white',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          maxTicksLimit: 8,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: 'white',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Humidity (%) / Pressure (hPa)',
          color: 'white',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
    animation: {
      duration: 300,
      easing: 'easeInOutQuart',
    },
    // Enable real-time updates
    responsive: true,
    maintainAspectRatio: false,
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Line 
        key={chartKey} 
        options={options} 
        data={chartData} 
        redraw={true}
      />
    </div>
  )
}

export default WeatherChart