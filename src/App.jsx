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
  const [currentTimeWindow, setCurrentTimeWindow] = useState(null)
  const [apiStatus, setApiStatus] = useState({
    weather: 'unknown',
    solar: 'unknown'
  })

  // Default location
  const defaultLocation = {
    latitude: 6.86666,
    longitude: 80.01667
  }

  // Calculate rolling 24-hour window boundaries
  const getRollingTimeWindow = () => {
    const now = new Date()
    const currentHour = now.getHours()
    
    // Start time: current hour today (for forecast - next 24 hours)
    const forecastStartTime = new Date(now)
    forecastStartTime.setHours(currentHour, 0, 0, 0)
    
    // End time: same hour tomorrow
    const forecastEndTime = new Date(forecastStartTime)
    forecastEndTime.setDate(forecastEndTime.getDate() + 1)
    
    // Historical start time: 24 hours ago from current hour
    const historicalStartTime = new Date(forecastStartTime)
    historicalStartTime.setDate(historicalStartTime.getDate() - 1)
    
    return { 
      historicalStartTime, 
      forecastStartTime, 
      forecastEndTime, 
      currentHour,
      windowLabel: `${currentHour}:00 - ${currentHour}:00 (+24h)`
    }
  }

  // Check if we need to update the rolling window (every hour)
  const shouldUpdateRollingWindow = () => {
    const now = new Date()
    const lastUpdateHour = lastUpdated.getHours()
    const currentHour = now.getHours()
    
    // Update if hour has changed or if it's been more than an hour
    return currentHour !== lastUpdateHour || (now - lastUpdated) > 3600000
  }

  // Fetch real-time weather data
  const fetchWeatherData = async () => {
    try {
      const data = await weatherApi.getLatestWeatherData(
        defaultLocation.latitude, 
        defaultLocation.longitude, 
        24
      )
      console.log('Fetched latest weather data:', data)
      
      const transformedData = data.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        }),
        temperature: item.temperature || 0,
        humidity: item.relative_humidity_2m || 0,
        pressure: item.pressure_msl || 0,
        windSpeed: item.wind_speed_10m || 0,
        cloudCover: item.cloud_cover || 0,
        irradiance: item.direct_normal_irradiance || 0
      }))
      
      console.log(`Weather data updated: ${transformedData.length} records`)
      setWeatherData(transformedData)
      
      if (transformedData.length > 0) {
        const latest = transformedData[transformedData.length - 1]
        setCurrentTemperature(latest.temperature)
        setCurrentHumidity(latest.humidity)
        setCurrentPressure(latest.pressure)
      }
      
      setApiStatus(prev => ({ ...prev, weather: 'connected' }))
      
    } catch (err) {
      console.error('Error fetching weather data:', err)
      setApiStatus(prev => ({ ...prev, weather: 'error' }))
    }
  }

  // Fetch real-time solar predictions (rolling 24-hour historical window)
  const fetchRealtimePredictions = async () => {
    try {
      const { historicalStartTime, forecastStartTime, currentHour, windowLabel } = getRollingTimeWindow()
      console.log(`Fetching real-time solar predictions for rolling window: ${windowLabel}`)
      console.log(`Historical window: ${historicalStartTime.toLocaleString()} to ${forecastStartTime.toLocaleString()}`)
      
      let data = []
      
      // Try to get predictions from database
      try {
        data = await solarApi.getSolarPredictions(48) // Get more data to filter
        console.log('Fetched realtime predictions from database:', data?.length || 0, 'records')
        
        // Filter data to rolling 24-hour historical window
        if (data && data.length > 0) {
          data = data.filter(item => {
            const itemTime = new Date(item.timestamp)
            return itemTime >= historicalStartTime && itemTime < forecastStartTime
          })
          console.log(`Filtered to historical rolling window: ${data.length} records`)
        }
      } catch (err) {
        console.warn('Database predictions failed:', err)
      }
      
      // Generate predictions if no data
      if (!data || data.length === 0) {
        try {
          console.log('No existing predictions, generating from database weather...')
          const predictionResult = await solarApi.predictFromDatabase(24, 'current', defaultLocation)
          console.log('Generated predictions from database:', predictionResult)
          
          data = await solarApi.getSolarPredictions(24)
          console.log('Fetched newly generated predictions:', data?.length || 0, 'records')
        } catch (err) {
          console.warn('Database prediction generation failed:', err)
        }
      }
      
      // No mock data - only use real API data
      
      // Sort and transform data
      if (data && data.length > 0) {
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        
        const transformedData = data.map(item => {
          const itemDate = new Date(item.timestamp)
          return {
            time: itemDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            }),
            hourLabel: `${itemDate.getHours()}:00`,
            predictedPower: item.predicted_power_kw || 0,
            temperature: item.weather_conditions?.temperature || 0,
            humidity: item.weather_conditions?.relative_humidity_2m || 0,
            timestamp: item.timestamp,
            weather_conditions: item.weather_conditions
          }
        })
        
        console.log(`Historical predictions updated: ${transformedData.length} records`)
        console.log('Time range:', transformedData.length > 0 ? 
          `${transformedData[0].time} to ${transformedData[transformedData.length - 1].time}` : 'No data')
        
        setRealtimePredictions(transformedData)
        
        if (transformedData.length > 0) {
          const latestPower = transformedData[transformedData.length - 1].predictedPower
          setCurrentPrediction(latestPower || 0)
        }
      } else {
        setRealtimePredictions([])
      }
      
      setApiStatus(prev => ({ ...prev, solar: 'connected' }))
      
    } catch (err) {
      console.error('Error fetching realtime predictions:', err)
      setApiStatus(prev => ({ ...prev, solar: 'error' }))
    }
  }

  // Fetch 24-hour forecast predictions (rolling window - next 24 hours)
  const fetchForecastPredictions = async () => {
    try {
      const { forecastStartTime, forecastEndTime, currentHour, windowLabel } = getRollingTimeWindow()
      console.log(`Fetching 24-hour forecast predictions for rolling window: ${windowLabel}`)
      console.log(`Forecast window: ${forecastStartTime.toLocaleString()} to ${forecastEndTime.toLocaleString()}`)
      
      let transformedForecastData = []
      
      // PRIMARY: Use the GET /solar-predictions/forecast endpoint (faster, from database)
      try {
        console.log('Using GET /solar-predictions/forecast endpoint for existing predictions...')
        const data = await solarApi.getForecastSolarPredictions(24, null)
        console.log('Fetched forecast predictions from database:', data?.length || 0, 'records')
        console.log('Sample forecast data from DB:', data?.slice(0, 2))
        
        if (data && Array.isArray(data) && data.length > 0) {
          transformedForecastData = data.map(item => {
            const itemDate = new Date(item.timestamp)
            const powerValue = item.predicted_power_kw || item.predicted_power || 0
            console.log(`DB Forecast item: ${item.timestamp} -> ${powerValue} kW`)
            return {
              time: itemDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              }),
              hourLabel: `${itemDate.getHours()}:00`,
              predictedPower: Math.max(0, powerValue),
              timestamp: item.timestamp,
              weather_conditions: item.weather_conditions,
              id: item.id,
              weather_data_id: item.weather_data_id
            }
          })
          console.log('Successfully transformed forecast data from database:', transformedForecastData.length, 'points')
          console.log('Sample transformed data:', transformedForecastData.slice(0, 2))
        } else {
          console.log('No forecast data available in database')
        }
      } catch (err) {
        console.warn('Database forecast endpoint failed:', err)
      }
      
      // FALLBACK 1: Try real-time forecast generation via POST /predict/forecast
      if (transformedForecastData.length === 0) {
        try {
          console.log('FALLBACK 1: Trying real-time forecast generation via POST /predict/forecast...')
          const forecastData = await solarApi.predictWithForecast(
            defaultLocation.latitude, 
            defaultLocation.longitude, 
            24
          )
          
          if (forecastData && forecastData.predictions && forecastData.predictions.length > 0) {
            console.log('Processing real-time forecast data:', forecastData.predictions.length, 'predictions')
            transformedForecastData = forecastData.predictions.map(item => {
              const itemDate = new Date(item.timestamp)
              const powerValue = item.predicted_power || item.predicted_power_kw || 0
              console.log(`Real-time forecast item: ${item.timestamp} -> ${powerValue} kW`)
              return {
                time: itemDate.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                }),
                hourLabel: `${itemDate.getHours()}:00`,
                predictedPower: Math.max(0, powerValue),
                timestamp: item.timestamp,
                weather_conditions: item.weather_conditions
              }
            })
            console.log('Successfully generated real-time forecast data:', transformedForecastData.length, 'points')
            console.log('Sample real-time forecast data:', transformedForecastData.slice(0, 2))
          }
        } catch (err) {
          console.warn('Real-time forecast generation failed:', err)
        }
      }

      // FALLBACK 2: Try generating predictions from database weather data
      if (transformedForecastData.length === 0) {
        try {
          console.log('FALLBACK 2: Trying to generate forecast predictions from database weather...')
          const predictionResult = await solarApi.predictFromDatabase(24, 'forecast', defaultLocation)
          console.log('Generated forecast predictions from database:', predictionResult)
          
          // Try to fetch the newly generated predictions
          const newData = await solarApi.getForecastSolarPredictions(24, null)
          if (newData && Array.isArray(newData) && newData.length > 0) {
            transformedForecastData = newData.map(item => {
              const itemDate = new Date(item.timestamp)
              const powerValue = item.predicted_power_kw || item.predicted_power || 0
              return {
                time: itemDate.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                }),
                hourLabel: `${itemDate.getHours()}:00`,
                predictedPower: Math.max(0, powerValue),
                timestamp: item.timestamp,
                weather_conditions: item.weather_conditions
              }
            })
            console.log('Successfully fetched newly generated forecast data:', transformedForecastData.length, 'points')
          }
        } catch (err) {
          console.warn('Database forecast generation failed:', err)
        }
      }
      
      // Final check and processing
      if (transformedForecastData.length === 0) {
        console.error('NO FORECAST DATA AVAILABLE from any source!')
        console.log('All forecast data sources failed:')
        console.log('1. GET /solar-predictions/forecast - failed')
        console.log('2. POST /predict/forecast - failed') 
        console.log('3. Database generation - failed')
        setApiStatus(prev => ({ ...prev, solar: 'error' }))
      } else {
        console.log('SUCCESS: Forecast data successfully obtained!')
        
        // Sort by timestamp to ensure proper order
        transformedForecastData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        
        // Limit to 24 points if we have more
        if (transformedForecastData.length > 24) {
          console.log(`Limiting forecast data from ${transformedForecastData.length} to 24 points`)
          transformedForecastData = transformedForecastData.slice(0, 24)
        }
        
        console.log(`FINAL FORECAST DATA: ${transformedForecastData.length} records`)
        console.log('Time range:', transformedForecastData.length > 0 ? 
          `${transformedForecastData[0].time} to ${transformedForecastData[transformedForecastData.length - 1].time}` : 'No data')
        console.log('Power range:', transformedForecastData.length > 0 ? 
          `${Math.min(...transformedForecastData.map(d => d.predictedPower)).toFixed(3)} - ${Math.max(...transformedForecastData.map(d => d.predictedPower)).toFixed(3)} kW` : 'No data')
        
        setApiStatus(prev => ({ ...prev, solar: 'connected' }))
      }
      
      setForecastPredictions(transformedForecastData)
      
    } catch (err) {
      console.error('Error fetching forecast predictions:', err)
      setApiStatus(prev => ({ ...prev, solar: 'error' }))
    }
  }

  // Fetch dashboard summary
  const fetchSummary = async () => {
    try {
      const data = await solarApi.getPredictionsSummary(null)
      setSummary(data)
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }

  // Fetch database status
  const fetchDatabaseStatus = async () => {
    try {
      const status = await solarApi.getDatabaseStatus()
      setDbStatus(status)
    } catch (err) {
      console.error('Error fetching database status:', err)
    }
  }

  // Fetch real battery data
  const fetchBatteryData = async () => {
    try {
      const batteryData = await solarApi.getBatteryStatus()
      console.log('Fetched battery data:', batteryData)
      
      // Update battery level from real data
      if (batteryData && typeof batteryData.level === 'number') {
        setBatteryLevel(batteryData.level)
      } else if (batteryData && typeof batteryData.battery_level === 'number') {
        setBatteryLevel(batteryData.battery_level)
      } else if (batteryData && typeof batteryData.charge_percentage === 'number') {
        setBatteryLevel(batteryData.charge_percentage)
      }
      
    } catch (err) {
      console.error('Error fetching battery data:', err)
      // Keep existing battery level if API fails
    }
  }

  // Main data fetch function
  const fetchAllData = async (isInitialLoad = false) => {
    try {
      setLoading(isInitialLoad)
      setError(null)
      
      // Update current time window
      const timeWindow = getRollingTimeWindow()
      setCurrentTimeWindow(timeWindow)
      
      await Promise.all([
        fetchWeatherData().catch(err => console.warn('Weather fetch failed:', err)),
        fetchRealtimePredictions().catch(err => console.warn('Realtime predictions failed:', err)),
        fetchForecastPredictions().catch(err => console.warn('Forecast predictions failed:', err)),
        fetchSummary().catch(err => console.warn('Summary failed:', err)),
        fetchDatabaseStatus().catch(err => console.warn('Database status failed:', err)),
        fetchBatteryData().catch(err => console.warn('Battery data fetch failed:', err))
      ])
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Some services are unavailable. Using available data.')
    } finally {
      setLoading(false)
    }
  }

  // Real-time data updates with hourly rolling window
  useEffect(() => {
    testAPIs()
    fetchAllData(true)
    
    // Quick updates every 30 seconds
    const quickInterval = setInterval(() => {
      console.log('Quick update triggered at:', new Date().toLocaleTimeString())
      
      if (shouldUpdateRollingWindow()) {
        console.log('HOURLY ROLLING WINDOW UPDATE - Fetching new 24-hour data window')
        fetchAllData(false)
        setLastUpdated(new Date())
      } else {
        console.log('Regular data refresh (same hour window)')
        fetchAllData(false)
      }
      
      // Battery level should be updated from real data source
      // setBatteryLevel updates removed - use real battery data instead
    }, 30000)
    
    // Guaranteed hourly updates
    const hourlyInterval = setInterval(() => {
      const timeWindow = getRollingTimeWindow()
      console.log(`HOURLY WINDOW UPDATE: ${timeWindow.windowLabel}`)
      fetchAllData(false)
      setLastUpdated(new Date())
    }, 3600000) // Every hour

    return () => {
      clearInterval(quickInterval)
      clearInterval(hourlyInterval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh handler
  const handleRefresh = async () => {
    console.log('Manual refresh triggered')
    setRefreshing(true)
    setError(null)
    
    try {
      setWeatherData([])
      setRealtimePredictions([])
      setForecastPredictions([])
      
      await fetchAllData(false)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Manual refresh failed:', err)
      setError('Refresh failed. Some data may not be updated.')
    } finally {
      setRefreshing(false)
    }
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
        <h1>Solar Energy Dashboard - Rolling 24h Window</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '0.9rem' 
        }}>
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          {currentTimeWindow && (
            <span style={{ 
              fontSize: '0.8rem', 
              backgroundColor: 'rgba(251, 191, 36, 0.2)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              Window: {currentTimeWindow.windowLabel}
            </span>
          )}
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
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
            <span style={{ 
              color: apiStatus.weather === 'connected' ? '#10b981' : '#ef4444'
            }}>
              Weather: {apiStatus.weather === 'connected' ? 'Live' : 'Off'}
            </span>
            <span style={{ 
              color: apiStatus.solar === 'connected' ? '#10b981' : '#ef4444'
            }}>
              Solar: {apiStatus.solar === 'connected' ? 'Live' : 'Off'}
            </span>
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
          <h2>Solar Generation (Last 24h Rolling)
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)',
              marginLeft: '10px'
            }}>
              ({realtimePredictions.length}/24 hours)
            </span>
          </h2>
          <div className="chart-container">
            <SolarPredictionChart data={realtimePredictions} key={`solar-${realtimePredictions.length}-${lastUpdated.getTime()}`} />
          </div>
        </div>
        
        <div className="widget">
          <h2>Solar Forecast (Next 24h Rolling)
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)',
              marginLeft: '10px'
            }}>
              ({forecastPredictions.length}/24 hours)
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