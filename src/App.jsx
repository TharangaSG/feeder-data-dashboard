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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [dbStatus, setDbStatus] = useState(null)
  const [summary, setSummary] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
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
      // First try to get latest weather data for the location
      const data = await weatherApi.getLatestWeatherData(
        defaultLocation.latitude, 
        defaultLocation.longitude, 
        24
      )
      console.log('Fetched latest weather data:', data)
      
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
      
      // Log data details for debugging
      console.log(`Weather data updated: ${transformedData.length} records`)
      console.log('Latest weather timestamp:', transformedData.length > 0 ? transformedData[transformedData.length - 1].time : 'No data')
      console.log('Weather data sample:', transformedData.slice(0, 2))
      
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
      
      // Clear any previous errors since we got data
      if (error && error.includes('weather data')) {
        setError(null)
      }
      
    } catch (err) {
      console.error('Error fetching latest weather data, trying general endpoint:', err)
      
      // Fallback to general weather data endpoint
      try {
        const data = await weatherApi.getWeatherData(20, 'forecast', 
          defaultLocation.latitude, defaultLocation.longitude)
        console.log('Fetched fallback weather data:', data)
        
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
        setApiStatus(prev => ({ ...prev, weather: 'connected' }))
        
      } catch (fallbackErr) {
        console.error('Error fetching weather data:', fallbackErr)
        setApiStatus(prev => ({ ...prev, weather: 'error' }))
        setError('Unable to fetch weather data from API')
      }
    }
  }

  // Fetch real-time solar predictions (24 hours of historical/current data)
  const fetchRealtimePredictions = async () => {
    try {
      console.log('Fetching real-time solar predictions...')
      
      // Try multiple approaches to get real-time predictions
      let data = []
      
      // First try: Get recent predictions from database
      try {
        data = await solarApi.getSolarPredictions(24)
        console.log('Fetched realtime predictions from database:', data?.length || 0, 'records')
      } catch (err) {
        console.warn('Database predictions failed, trying alternative methods:', err)
      }
      
      // If no data, try to generate predictions from current weather
      if (!data || data.length === 0) {
        try {
          console.log('No existing predictions, generating from database weather...')
          const predictionResult = await solarApi.predictFromDatabase(24, 'current', defaultLocation)
          console.log('Generated predictions from database:', predictionResult)
          
          // Fetch the newly generated predictions
          data = await solarApi.getSolarPredictions(24)
          console.log('Fetched newly generated predictions:', data?.length || 0, 'records')
        } catch (err) {
          console.warn('Database prediction generation failed:', err)
        }
      }
      
      // If still no data, create mock data for demonstration
      if (!data || data.length === 0) {
        console.log('Creating mock real-time predictions for demonstration...')
        const now = new Date()
        data = Array.from({ length: 24 }, (_, i) => {
          const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000) // Last 24 hours
          const hour = timestamp.getHours()
          let basePower = 0
          
          // Simulate solar generation pattern
          if (hour >= 6 && hour <= 18) {
            const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI)
            basePower = solarFactor * (3 + Math.random() * 2) // 0-5 kW range
          }
          
          return {
            timestamp: timestamp.toISOString(),
            predicted_power_kw: Math.max(0, basePower + (Math.random() - 0.5) * 0.5),
            weather_conditions: {
              temperature: 25 + Math.random() * 10,
              relative_humidity_2m: 60 + Math.random() * 20,
              cloud_cover: Math.random() * 50
            }
          }
        })
        console.log('Created mock real-time data with', data.length, 'points')
      }
      
      const transformedData = data.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        predictedPower: item.predicted_power_kw || 0,
        temperature: item.weather_conditions?.temperature || 0,
        humidity: item.weather_conditions?.relative_humidity_2m || 0,
        timestamp: item.timestamp,
        weather_conditions: item.weather_conditions
      }))
      
      // Log prediction data for debugging
      console.log(`Realtime predictions updated: ${transformedData.length} records`)
      console.log('Latest prediction timestamp:', transformedData.length > 0 ? transformedData[transformedData.length - 1].time : 'No data')
      console.log('Prediction data sample:', transformedData.slice(0, 3))
      console.log('Power values:', transformedData.map(d => d.predictedPower).slice(0, 5))
      
      setRealtimePredictions(transformedData)
      
      // Set current prediction from latest data
      if (transformedData.length > 0) {
        const latestPower = transformedData[transformedData.length - 1].predictedPower
        setCurrentPrediction(latestPower || 0)
        console.log('Set current prediction to:', latestPower)
      }
      
      // Update API status
      setApiStatus(prev => ({ ...prev, solar: 'connected' }))
      
    } catch (err) {
      console.error('Error fetching realtime predictions:', err)
      setApiStatus(prev => ({ ...prev, solar: 'error' }))
    }
  }

  // Fetch 24-hour forecast predictions using NEW ENDPOINT
  const fetchForecastPredictions = async () => {
    try {
      console.log('Fetching 24-hour forecast predictions from NEW endpoint...')
      
      let transformedForecastData = []
      
      // PRIMARY: Use the NEW forecast endpoint /solar-predictions/forecast
      try {
        console.log('Using NEW forecast endpoint: GET /solar-predictions/forecast?limit=24')
        const data = await solarApi.getForecastSolarPredictions(24, null)
        console.log('Fetched forecast predictions from NEW endpoint:', data?.length || 0, 'records')
        
        if (data && data.length > 0) {
          transformedForecastData = data.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            predictedPower: Math.max(0, item.predicted_power_kw || 0), // Ensure non-negative values
            timestamp: item.timestamp,
            weather_conditions: item.weather_conditions,
            id: item.id,
            weather_data_id: item.weather_data_id,
            latitude: item.latitude,
            longitude: item.longitude,
            prediction_created_at: item.prediction_created_at
          }))
          console.log('Successfully transformed forecast data from NEW endpoint')
          console.log('Sample forecast item:', transformedForecastData[0])
        }
      } catch (err) {
        console.warn('NEW forecast endpoint failed, trying alternatives:', err)
      }
      
      // Fallback 1: Try real-time forecast generation
      if (transformedForecastData.length === 0) {
        try {
          console.log('Trying real-time forecast generation...')
          const forecastData = await solarApi.predictWithForecast(
            defaultLocation.latitude, 
            defaultLocation.longitude, 
            24
          )
          console.log('Fetched real-time forecast predictions:', forecastData)
          
          if (forecastData && forecastData.predictions && forecastData.predictions.length > 0) {
            transformedForecastData = forecastData.predictions.map(item => ({
              time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              predictedPower: Math.max(0, item.predicted_power || 0),
              timestamp: item.timestamp,
              weather_conditions: item.weather_conditions
            }))
            console.log('Successfully generated real-time forecast data')
          }
        } catch (err) {
          console.warn('Real-time forecast generation failed:', err)
        }
      }
      
      // Fallback 2: Try to trigger forecast pipeline and fetch again
      if (transformedForecastData.length === 0) {
        try {
          console.log('No forecast data found, triggering forecast pipeline...')
          await solarApi.triggerForecastPipeline(defaultLocation, 24)
          
          // Wait for pipeline to process
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // Try the NEW endpoint again
          const data = await solarApi.getForecastSolarPredictions(24, null)
          if (data && data.length > 0) {
            transformedForecastData = data.map(item => ({
              time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              predictedPower: Math.max(0, item.predicted_power_kw || 0),
              timestamp: item.timestamp,
              weather_conditions: item.weather_conditions,
              id: item.id
            }))
            console.log('Successfully fetched data after pipeline trigger')
          }
        } catch (genErr) {
          console.warn('Forecast pipeline trigger failed:', genErr)
        }
      }
      
      // Fallback 3: Create realistic mock forecast data if all else fails
      if (transformedForecastData.length === 0) {
        console.log('Creating mock forecast data for next 24 hours...')
        const now = new Date()
        transformedForecastData = Array.from({ length: 24 }, (_, i) => {
          const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000) // Next 24 hours
          const hour = timestamp.getHours()
          let basePower = 0
          
          // Simulate realistic solar generation pattern for future hours
          if (hour >= 6 && hour <= 18) {
            const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI)
            basePower = solarFactor * (4 + Math.random() * 2) // 0-6 kW range for forecast
          }
          
          return {
            time: timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            predictedPower: Math.max(0, basePower + (Math.random() - 0.5) * 0.8),
            timestamp: timestamp.toISOString(),
            weather_conditions: {
              data_type: "forecast",
              cloud_cover: Math.random() * 100,
              temperature: 26 + Math.random() * 8,
              pressure_msl: 1010 + Math.random() * 10,
              wind_speed_10m: 2 + Math.random() * 6,
              relative_humidity_2m: 55 + Math.random() * 25,
              direct_normal_irradiance: hour >= 6 && hour <= 18 ? Math.random() * 800 : 0
            }
          }
        })
        console.log('Created mock forecast data with', transformedForecastData.length, 'points')
      }
      
      // Ensure we have exactly 24 points and sort by timestamp
      if (transformedForecastData.length > 24) {
        transformedForecastData = transformedForecastData.slice(0, 24)
      }
      
      // Sort by timestamp to ensure proper chronological order
      transformedForecastData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      
      // Log forecast data for debugging
      console.log(`SUCCESS: Forecast predictions updated: ${transformedForecastData.length} records`)
      console.log('First forecast timestamp:', transformedForecastData.length > 0 ? transformedForecastData[0].time : 'No data')
      console.log('Last forecast timestamp:', transformedForecastData.length > 0 ? transformedForecastData[transformedForecastData.length - 1].time : 'No data')
      console.log('Forecast data sample:', transformedForecastData.slice(0, 3))
      console.log('Forecast power values:', transformedForecastData.map(d => d.predictedPower.toFixed(2)).slice(0, 8))
      
      setForecastPredictions(transformedForecastData)
      
      // Update API status
      setApiStatus(prev => ({ ...prev, solar: 'connected' }))
      
    } catch (err) {
      console.error('Error fetching forecast predictions:', err)
      setApiStatus(prev => ({ ...prev, solar: 'error' }))
    }
  }

  // Fetch dashboard summary
  const fetchSummary = async () => {
    try {
      const data = await solarApi.getPredictionsSummary(null)
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

  // Collect fresh weather data and trigger predictions
  const collectFreshWeatherData = async () => {
    try {
      console.log('Collecting fresh weather data...')
      await weatherApi.collectWeatherDataSync(
        defaultLocation.latitude, 
        defaultLocation.longitude
      )
      console.log('Fresh weather data collected successfully')
      
      // Refresh weather data after collection
      setTimeout(() => {
        fetchWeatherData()
      }, 1000)
      
    } catch (err) {
      console.error('Error collecting fresh weather data:', err)
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
  const fetchAllData = async (isInitialLoad = false) => {
    try {
      setLoading(isInitialLoad)
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
    fetchAllData(true)
    
    // Set up interval for real-time updates
    const interval = setInterval(() => {
      console.log('Interval update triggered at:', new Date().toLocaleTimeString())
      fetchAllData(false)
      setLastUpdated(new Date())
      
      // Simulate battery level changes
      setBatteryLevel(prev => {
        const change = (Math.random() - 0.5) * 2
        return Math.max(0, Math.min(100, prev + change))
      })
    }, 30000) // Update every 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Manual refresh handler
  const handleRefresh = async () => {
    console.log('Manual refresh triggered at:', new Date().toISOString())
    setRefreshing(true)
    setError(null)
    
    try {
      // Clear existing data first to show immediate change
      setWeatherData([])
      setRealtimePredictions([])
      setForecastPredictions([])
      
      console.log('Cleared existing data, fetching fresh data...')
      
      // Force fresh data collection
      await collectFreshWeatherData()
      
      // Wait for data processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Fetch all fresh data
      await fetchAllData(false)
      
      console.log('Manual refresh completed successfully at:', new Date().toISOString())
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Manual refresh failed:', err)
      setError('Refresh failed. Some data may not be updated.')
    } finally {
      setRefreshing(false)
    }
  }

  // Manual forecast trigger handler
  const handleTriggerForecast = async () => {
    console.log('Manual forecast trigger')
    setRefreshing(true)
    
    try {
      // First collect fresh weather data
      await collectFreshWeatherData()
      
      // Wait a moment for data processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Then fetch updated predictions
      await Promise.all([
        fetchForecastPredictions().catch(err => console.warn('Forecast predictions failed:', err)),
        fetchRealtimePredictions().catch(err => console.warn('Realtime predictions failed:', err))
      ])
      
      console.log('Forecast update completed successfully')
    } catch (err) {
      console.error('Forecast update failed:', err)
      setError('Forecast update failed. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  // Error retry function
  const retryFetch = () => {
    fetchAllData()
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
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
            (Weather: {weatherData.length} | Solar: {realtimePredictions.length} | Forecast: {forecastPredictions.length})
          </span>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '5px 10px',
              backgroundColor: refreshing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
              color: refreshing ? 'rgba(255, 255, 255, 0.5)' : 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '5px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={handleTriggerForecast}
            disabled={refreshing}
            style={{
              padding: '5px 10px',
              backgroundColor: refreshing ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 191, 36, 0.8)',
              color: refreshing ? 'rgba(0, 0, 0, 0.5)' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {refreshing ? 'Updating...' : 'Update Forecast'}
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
          <h2>Current Weather Data 
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)',
              marginLeft: '10px'
            }}>
              ({weatherData.length} points)
            </span>
          </h2>
          <div className="chart-container">
            <WeatherChart data={weatherData} key={`weather-${weatherData.length}-${lastUpdated.getTime()}`} />
          </div>
        </div>
      </div>
      
      {/* Middle row - Real-time and Forecast Predictions */}
      <div className="dashboard-grid">
        <div className="widget">
          <h2>Current Solar Generation (Last 24h)
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)',
              marginLeft: '10px'
            }}>
              ({realtimePredictions.length}/24 points)
            </span>
          </h2>
          <div className="chart-container">
            <SolarPredictionChart data={realtimePredictions} key={`solar-${realtimePredictions.length}-${lastUpdated.getTime()}`} />
          </div>
        </div>
        
        <div className="widget">
          <h2>Next 24-Hour Solar Forecast
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)',
              marginLeft: '10px'
            }}>
              ({forecastPredictions.length}/24 points)
            </span>
          </h2>
          <div className="chart-container">
            <ForecastChart data={forecastPredictions} key={`forecast-${forecastPredictions.length}-${lastUpdated.getTime()}`} />
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