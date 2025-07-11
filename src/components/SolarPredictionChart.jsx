import React, { useMemo } from 'react'
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

const SolarPredictionChart = ({ data, actualData = [] }) => {
  // Remove the problematic chartKey state and useEffect that causes infinite re-renders

  // Memoize chart data to prevent unnecessary re-calculations
  const chartData = useMemo(() => {
    // Handle empty or invalid data gracefully
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Predicted Power',
          data: [0],
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderWidth: 3,
          fill: true,
          pointBackgroundColor: '#fbbf24',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }]
      }
    }

    // Validate and clean data
    const validData = data.filter(item => item && typeof item === 'object')
    if (validData.length === 0) {
      return {
        labels: ['No Valid Data'],
        datasets: [{
          label: 'Predicted Power',
          data: [0],
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderWidth: 3,
          fill: true,
        }]
      }
    }

    const datasets = [
      {
        label: 'Predicted Power',
        data: validData.map(item => {
          const power = item.predictedPower || item.predicted_power_kw || item.predicted_power || 0
          return typeof power === 'number' && !isNaN(power) ? power : 0
        }),
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderWidth: 3,
        fill: true,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#fbbf24',
        pointHoverBorderWidth: 3,
        tension: 0.4,
      }
    ]

    // Add actual data if available
    if (actualData && Array.isArray(actualData) && actualData.length > 0) {
      const validActualData = actualData.filter(item => item && typeof item === 'object')
      if (validActualData.length > 0) {
        datasets.push({
          label: 'Actual Power',
          data: validActualData.map(item => {
            const power = item.actualPower || item.actual_power_kw || 0
            return typeof power === 'number' && !isNaN(power) ? power : 0
          }),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#10b981',
          pointHoverBorderWidth: 3,
          tension: 0.4,
        })
      }
    }

    return {
      labels: validData.map(item => item.time || item.timestamp || 'Unknown'),
      datasets: datasets,
    }
  }, [data, actualData])
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
        text: 'Real-time Solar Power Forecast',
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
            return `${datasetLabel}: ${value.toFixed(2)} kW`
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
        display: true,
        title: {
          display: true,
          text: 'Power Output (kW)',
          color: 'white',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          callback: function(value) {
            return value.toFixed(1) + ' kW'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        min: 0,
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
        options={options} 
        data={chartData}
      />
    </div>
  )
}

export default SolarPredictionChart