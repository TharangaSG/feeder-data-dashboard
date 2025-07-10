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

const ForecastChart = ({ data, title = "24-Hour Solar Power Forecast" }) => {
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
      labels: data.map(item => {
        // Handle both timestamp and time formats
        const timestamp = item.timestamp || item.time
        if (timestamp) {
          const date = new Date(timestamp)
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          })
        }
        return item.time || 'Unknown'
      }),
      datasets: [
        {
          label: 'Predicted Solar Power',
          data: data.map(item => {
            // Handle both predictedPower and predicted_power_kw formats
            return item.predictedPower || item.predicted_power_kw || 0
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
        text: title,
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
            const value = context.parsed.y
            return `Predicted Power: ${value.toFixed(2)} kW`
          },
          afterLabel: function(context) {
            const dataPoint = data[context.dataIndex]
            if (dataPoint && dataPoint.weather_conditions) {
              const weather = dataPoint.weather_conditions
              return [
                `Temperature: ${weather.temperature?.toFixed(1)}°C`,
                `Humidity: ${weather.relative_humidity_2m?.toFixed(1)}%`,
                `Cloud Cover: ${weather.cloud_cover?.toFixed(1)}%`,
                `Irradiance: ${weather.direct_normal_irradiance?.toFixed(0)} W/m²`
              ]
            }
            return []
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
          maxTicksLimit: 12,
          callback: function(value, index) {
            const label = this.getLabelForValue(value)
            // Show every 2nd label to avoid crowding
            return index % 2 === 0 ? label : ''
          }
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
        hoverRadius: 6,
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

export default ForecastChart