import React, { useState, useEffect } from 'react'
import BatteryIndicator from './components/BatteryIndicator'
import WeatherChart from './components/WeatherChart'
import SolarPredictionChart from './components/SolarPredictionChart'
import ForecastChart from './components/ForecastChart'
import StatsGrid from './components/StatsGrid'
import { weatherApi } from './services/weatherApi'
import { solarApi } from './services/solarApi'
import { testAPIs } from './utils/apiTest'

function App() {
  // State for real-time data
  const [batteryLevel, setBatteryLevel] = useState(75)
  const [weatherData, setWeatherData] = useState([])
  const [currentTemperature, setCurrentTemperature] = useState(0)
  const [currentHumidity, setCurrentHumidity] = useState(0)
  const [currentPressure, setCurrentPressure] = useState(0)
  
  // State for solar predictions
  const [realtimePredictions, setRealtimePredictions] = useState([])
  const [forecastPredictions, setForecastPredictions] = useState([])
  const [currentPrediction, setCurrentPrediction] = useState(0)
  
  // State for dashboard status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dbStatus, setDbStatus] = useState(null)
  const [summary, setSummary] = useState(null)
  const [apiStatus, setApiStatus] = useState({
    weather: 'unknown',
    solar: 'unknown'
  })

  // Default location (you can make this configurable)
  const defaultLocation = {
    latitude: 6.86666,
    longitude: 80.01667
  }

  // Fetch real-time weather data
  const fetchWeatherData = async () => {
    try {
      const data = await weatherApi.getWeatherData(20, 'forecast')
      console.log('Fetched weather data:', data)
      
      // Transform the data for the chart
      const transformedData = data.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temperature: item.temperature || 0,
        humidity: item.relative_humidity_2m || 0,
        pressure: item.pressure_msl || 0,
        windSpeed: item.wind_speed_10m || 0,
        cloudCover: item.cloud_cover || 0,
        irradiance: item.direct_normal_irradiance || 0
      }))
      
      setWeatherData(transformedData)
      
      // Set current values from the latest data point
      if (transformedData.length > 0) {
        const latest = transformedData[transformedData.length - 1]
        setCurrentTemperature(latest.temperature)
        setCurrentHumidity(latest.humidity)
        setCurrentPressure(latest.pressure)
      }
      
      // Update API status
      setApiStatus(prev => ({ ...prev, weather: 'connected' }))
      
      // Clear any previous errors since we got data (even if mock)
      if (error && error.includes('weather data')) {
        setError(null)
      }
      
    } catch (err) {
      console.error('Error fetching weather data:', err)
      setApiStatus(prev => ({ ...prev, weather: 'mock' }))
      console.log('Using mock weather data due to API unavailability')
    }
  }

  // Fetch real-time solar predictions
  const fetchRealtimePredictions = async () => {
    try {
      const data = await solarApi.getSolarPredictions(20)
      console.log('Fetched realtime predictions:', data)
      
      const transformedData = data.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        predictedPower: item.predicted_power_kw,
        temperature: item.weather_conditions?.temperature || 0,
        humidity: item.weather_conditions?.relative_humidity_2m || 0,
        timestamp: item.timestamp,
        weather_conditions: item.weather_conditions
      }))
      
      setRealtimePredictions(transformedData)
      
      // Set current prediction from latest data
      if (transformedData.length > 0) {
        setCurrentPrediction(transformedData[transformedData.length - 1].predictedPower)
      }
      
    } catch (err) {
      console.error('Error fetching realtime predictions:', err)
    }
  }

  // Fetch 24-hour forecast predictions
  const fetchForecastPredictions = async () => {
    try {
      const data = await solarApi.getForecastSolarPredictions(24, defaultLocation)
      console.log('Fetched forecast predictions:', data)
      
      setForecastPredictions(data)
      
    } catch (err) {
      console.error('Error fetching forecast predictions:', err)
    }
  }

  // Fetch dashboard summary
  const fetchSummary = async () => {
    try {
      const data = await solarApi.getPredictionsSummary(defaultLocation)
      console.log('Fetched summary:', data)
      setSummary(data)
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }

  // Fetch database status
  const fetchDatabaseStatus = async () => {
    try {
      const status = await solarApi.getDatabaseStatus()
      console.log('Database status:', status)
      setDbStatus(status)
    } catch (err) {
      console.error('Error fetching database status:', err)
    }
  }

  // Trigger forecast pipeline if needed
  const triggerForecastPipeline = async () => {
    try {
      console.log('Triggering forecast pipeline...')
      await solarApi.triggerForecastPipeline(defaultLocation, 24)
      console.log('Forecast pipeline triggered successfully')
      
      // Refresh forecast data after pipeline
      setTimeout(() => {
        fetchForecastPredictions()
      }, 2000)
      
    } catch (err) {
      console.error('Error triggering forecast pipeline:', err)
    }
  }

  // Main data fetch function
  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch weather data (with fallback to mock data)
      await fetchWeatherData()
      
      // Fetch solar data (these might fail, so handle individually)
      try {
        await fetchRealtimePredictions()
        setApiStatus(prev => ({ ...prev, solar: 'connected' }))
      } catch (err) {
        console.error('Solar predictions failed:', err)
        setApiStatus(prev => ({ ...prev, solar: 'disconnected' }))
      }
      
      try {
        await fetchForecastPredictions()
      } catch (err) {
        console.error('Forecast predictions failed:', err)
      }
      
      try {
        await fetchSummary()
      } catch (err) {
        console.error('Summary fetch failed:', err)
      }
      
      try {
        await fetchDatabaseStatus()
      } catch (err) {
        console.error('Database status failed:', err)
      }
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Some services are unavailable. Using available data.')
    } finally {
      setLoading(false)
    }
  }

  // Real-time data updates
  useEffect(() => {
    // Test API connections first
    testAPIs()
    
    // Initial fetch
    fetchAllData()
    
    // Set up interval for real-time updates
    const interval = setInterval(() => {
      fetchAllData()
      
      // Simulate battery level changes (you can replace this with real battery data)
      setBatteryLevel(prev => {
        const change = (Math.random() - 0.5) * 2
        return Math.max(0, Math.min(100, prev + change))
      })
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Auto-trigger forecast pipeline if no forecast data
  useEffect(() => {
    if (!loading && forecastPredictions.length === 0 && dbStatus?.weather_records > 0) {
      console.log('No forecast predictions found, triggering pipeline...')
      triggerForecastPipeline()
    }
  }, [loading, forecastPredictions.length, dbStatus])

  // Error retry function
  const retryFetch = () => {
    fetchAllData()
  }

  // Manual refresh function
  const handleRefresh = () => {
    fetchAllData()
  }

  // Manual trigger forecast
  const handleTriggerForecast = () => {
    triggerForecastPipeline()
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Solar Energy Dashboard</h1>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          Loading dashboard data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Solar Energy Dashboard</h1>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Warning: {error}
          </div>
          <button 
            onClick={retryFetch}
            style={{
              padding: '10px 20px',
              backgroundColor: '#fbbf24',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Solar Energy Dashboard</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '0.9rem' 
        }}>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button 
            onClick={handleRefresh}
            style={{
              padding: '5px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Refresh
          </button>
          <button 
            onClick={handleTriggerForecast}
            style={{
              padding: '5px 10px',
              backgroundColor: 'rgba(251, 191, 36, 0.8)',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Update Forecast
          </button>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
            <span style={{ 
              color: apiStatus.weather === 'connected' ? '#10b981' : 
                     apiStatus.weather === 'mock' ? '#fbbf24' : '#ef4444'
            }}>
              Weather: {apiStatus.weather === 'connected' ? 'Live' : 
                        apiStatus.weather === 'mock' ? 'Mock' : 'Off'}
            </span>
            <span style={{ 
              color: apiStatus.solar === 'connected' ? '#10b981' : '#ef4444'
            }}>
              Solar: {apiStatus.solar === 'connected' ? 'Live' : 'Off'}
            </span>
            {dbStatus && (
              <span>
                DB: {dbStatus.weather_records}W, {dbStatus.prediction_records}P
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Top row - Battery and Current Weather */}
      <div className="dashboard-grid">
        <div className="widget">
          <h2>Battery Status</h2>
          <BatteryIndicator level={batteryLevel} />
        </div>
        
        <div className="widget">
          <h2>Current Weather Data</h2>
          <div className="chart-container">
            <WeatherChart data={weatherData} />
          </div>
        </div>
      </div>
      
      {/* Middle row - Real-time and Forecast Predictions */}
      <div className="dashboard-grid">
        <div className="widget">
          <h2>Real-time Solar Predictions</h2>
          <div className="chart-container">
            <SolarPredictionChart data={realtimePredictions} />
          </div>
        </div>
        
        <div className="widget">
          <h2>24-Hour Solar Forecast</h2>
          <div className="chart-container">
            <ForecastChart data={forecastPredictions} />
          </div>
        </div>
      </div>
      
      {/* Statistics Grid */}
      <StatsGrid 
        currentTemperature={currentTemperature}
        currentHumidity={currentHumidity}
        currentPressure={currentPressure}
        currentPrediction={currentPrediction}
        batteryLevel={batteryLevel}
        weatherData={weatherData}
        summary={summary}
        forecastCount={forecastPredictions.length}
      />
    </div>
  )
}

export default App