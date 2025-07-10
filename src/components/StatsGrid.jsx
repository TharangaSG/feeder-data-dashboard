import React from 'react'

const StatsGrid = ({ currentTemperature, currentHumidity, currentPressure, currentPrediction, batteryLevel, weatherData, summary, forecastCount }) => {
  const getTemperatureColor = (temp) => {
    if (temp > 30) return '#ef4444' // Hot - Red
    if (temp > 20) return '#fbbf24' // Warm - Yellow
    if (temp > 10) return '#10b981' // Cool - Green
    return '#3b82f6' // Cold - Blue
  }

  const getHumidityColor = (humidity) => {
    if (humidity > 70) return '#3b82f6' // High - Blue
    if (humidity > 40) return '#10b981' // Normal - Green
    return '#fbbf24' // Low - Yellow
  }

  const getPressureColor = (pressure) => {
    if (pressure > 1020) return '#10b981' // High - Green
    if (pressure > 1000) return '#fbbf24' // Normal - Yellow
    return '#ef4444' // Low - Red
  }

  const getPredictionColor = (prediction) => {
    if (prediction > 4) return '#10b981' // High - Green
    if (prediction > 2) return '#fbbf24' // Medium - Yellow
    if (prediction > 0) return '#f97316' // Low - Orange
    return '#6b7280' // None - Gray
  }

  // Calculate weather statistics
  const avgTemperature = weatherData.length > 0 
    ? weatherData.reduce((sum, item) => sum + item.temperature, 0) / weatherData.length 
    : 0
  
  const maxTemperature = weatherData.length > 0 
    ? Math.max(...weatherData.map(item => item.temperature))
    : 0
    
  const minTemperature = weatherData.length > 0 
    ? Math.min(...weatherData.map(item => item.temperature))
    : 0

  const stats = [
    {
      label: 'Current Temperature',
      value: `${currentTemperature.toFixed(1)}°C`,
      icon: '🌡️',
      color: getTemperatureColor(currentTemperature)
    },
    {
      label: 'Current Humidity',
      value: `${currentHumidity.toFixed(1)}%`,
      icon: '💧',
      color: getHumidityColor(currentHumidity)
    },
    {
      label: 'Current Pressure',
      value: `${currentPressure.toFixed(1)} hPa`,
      icon: '📊',
      color: getPressureColor(currentPressure)
    },
    {
      label: 'Solar Prediction',
      value: `${currentPrediction.toFixed(2)} kW`,
      icon: '☀️',
      color: getPredictionColor(currentPrediction)
    },
    {
      label: 'Daily Est. Generation',
      value: `${(currentPrediction * 8).toFixed(1)} kWh`,
      icon: '⚡',
      color: '#8b5cf6'
    },
    {
      label: 'Forecast Data Points',
      value: `${forecastCount || 0}`,
      icon: '📅',
      color: '#06b6d4'
    },
    {
      label: 'Total Predictions',
      value: `${summary?.total_predictions || 0}`,
      icon: '📊',
      color: '#8b5cf6'
    }
  ]

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
            {stat.icon}
          </div>
          <div className="stat-value" style={{ color: stat.color }}>
            {stat.value}
          </div>
          <div className="stat-label">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsGrid