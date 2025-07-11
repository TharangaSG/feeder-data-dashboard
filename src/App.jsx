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
      
      // Try to get predictions from database (skip database generation if it fails)
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
      
      // Skip database generation since it's causing 503 errors
      console.log('Skipping database prediction generation due to service unavailability')
      
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

  // Fetch 24-hour forecast predictions (rolling window - next 24 hours from current hour)
  const fetchForecastPredictions = async () => {
    try {
      // Calculate real-time forecast window starting from current hour
      const now = new Date()
      const currentHour = now.getHours()
      
      // Start time: current hour (e.g., if it's 3:15, start at 3:00)
      const forecastStartTime = new Date(now)
      forecastStartTime.setHours(currentHour, 0, 0, 0)
      
      // End time: 24 hours from current hour (e.g., 3:00 tomorrow)
      const forecastEndTime = new Date(forecastStartTime)
      forecastEndTime.setHours(forecastEndTime.getHours() + 24)
      
      const windowLabel = `${currentHour}:00 - ${(currentHour + 24) % 24}:00 (+24h)`
      
      console.log(`Fetching 24-hour forecast predictions starting from current hour: ${windowLabel}`)
      console.log(`Real-time forecast window: ${forecastStartTime.toLocaleString()} to ${forecastEndTime.toLocaleString()}`)
      
      let transformedForecastData = []
      
      // Keep existing data if new fetch fails
      const currentForecastData = forecastPredictions
      
      // PRIMARY: Try POST /predict/forecast first since it's confirmed working (with retry)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`PRIMARY: Using POST /predict/forecast endpoint (attempt ${attempt}/2)...`)
          const forecastData = await solarApi.predictWithForecast(
            defaultLocation.latitude, 
            defaultLocation.longitude, 
            24
          )
        
        if (forecastData && forecastData.predictions && forecastData.predictions.length > 0) {
          console.log('SUCCESS: Got forecast data from POST endpoint:', forecastData.predictions.length, 'predictions')
          console.log('Sample POST forecast data:', forecastData.predictions.slice(0, 2))
          
          // Filter real-time forecast data to match our time window
          const filteredPredictions = forecastData.predictions.filter(item => {
            const itemTime = new Date(item.timestamp)
            return itemTime >= forecastStartTime && itemTime < forecastEndTime
          })
          
          console.log(`Filtered POST forecast to time window: ${filteredPredictions.length} records`)
          
          transformedForecastData = filteredPredictions.map(item => {
            const itemDate = new Date(item.timestamp)
            const powerValue = item.predicted_power || item.predicted_power_kw || 0
            console.log(`POST forecast item: ${item.timestamp} -> ${powerValue} kW`)
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
          console.log('Successfully processed POST forecast data:', transformedForecastData.length, 'points')
          break // Success, exit retry loop
        } else {
          console.warn(`POST /predict/forecast returned no predictions (attempt ${attempt}/2)`)
          if (attempt === 2) {
            console.warn('POST /predict/forecast failed after 2 attempts - no predictions returned')
          }
        }
        } catch (err) {
          console.warn(`POST /predict/forecast failed (attempt ${attempt}/2):`, err.message)
          if (attempt === 2) {
            console.warn('POST /predict/forecast failed after 2 attempts')
          } else {
            console.log('Retrying POST /predict/forecast in 2 seconds...')
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
          }
        }
        
        // If we got data, break out of retry loop
        if (transformedForecastData.length > 0) break
      }
      
      // FALLBACK: Use the GET /solar-predictions/forecast endpoint if POST failed
      if (transformedForecastData.length === 0) {
        try {
          console.log('FALLBACK: Using GET /solar-predictions/forecast endpoint...')
          console.log('Requesting forecast data with limit=48...')
          const data = await solarApi.getForecastSolarPredictions(48, null) // Get more data to filter by time
          console.log('Fetched forecast predictions from database:', data?.length || 0, 'records')
          console.log('Sample forecast data from DB:', data?.slice(0, 2))
          
          if (!data || data.length === 0) {
            console.warn('GET /solar-predictions/forecast returned no data!')
          }
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('Raw forecast data sample:', data.slice(0, 3))
          console.log('Raw forecast data timestamps:', data.slice(0, 5).map(item => item.timestamp))
          console.log('Raw forecast data power values:', data.slice(0, 5).map(item => ({
            timestamp: item.timestamp,
            predicted_power_kw: item.predicted_power_kw,
            predicted_power: item.predicted_power,
            power_value: item.predicted_power_kw || item.predicted_power || 'ZERO/UNDEFINED'
          })))
          
          // Filter data to real-time forecast window (next 24 hours from current hour)
          const filteredData = data.filter(item => {
            const itemTime = new Date(item.timestamp)
            const isInRange = itemTime >= forecastStartTime && itemTime < forecastEndTime
            if (!isInRange && data.indexOf(item) < 3) {
              console.log(`Item ${item.timestamp} outside range: ${itemTime.toLocaleString()} not in ${forecastStartTime.toLocaleString()} - ${forecastEndTime.toLocaleString()}`)
            }
            return isInRange
          })
          
          console.log(`Filtered forecast data to real-time window: ${filteredData.length} records from ${data.length} total`)
          console.log(`Time filter: ${forecastStartTime.toLocaleString()} to ${forecastEndTime.toLocaleString()}`)
          
          if (filteredData.length === 0 && data.length > 0) {
            console.warn('WARNING: No data matches the time filter! Using all available data instead.')
            // Fallback: use all data if time filtering removes everything
            const allData = data.slice(0, 24) // Limit to 24 points
            console.log('Fallback data power values:', allData.slice(0, 5).map(item => ({
              timestamp: item.timestamp,
              predicted_power_kw: item.predicted_power_kw,
              predicted_power: item.predicted_power,
              final_power: item.predicted_power_kw || item.predicted_power || 0
            })))
            
            transformedForecastData = allData.map(item => {
              const itemDate = new Date(item.timestamp)
              const powerValue = item.predicted_power_kw || item.predicted_power || 0
              console.log(`Fallback transform: ${item.timestamp} -> ${powerValue} kW (from predicted_power_kw: ${item.predicted_power_kw}, predicted_power: ${item.predicted_power})`)
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
            console.log('Using fallback: all available data:', transformedForecastData.length, 'points')
            console.log('Fallback transformed power values:', transformedForecastData.slice(0, 5).map(item => ({
              time: item.time,
              predictedPower: item.predictedPower
            })))
          } else if (filteredData.length > 0) {
            // Use filtered data if we have matches
            transformedForecastData = filteredData.map(item => {
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
          }
          console.log('Successfully transformed forecast data from database:', transformedForecastData.length, 'points')
          console.log('Sample transformed data:', transformedForecastData.slice(0, 2))
        } else {
          console.log('No forecast data available in database')
        }
        } catch (err) {
          console.warn('Database forecast endpoint failed:', err)
        }
      }

      // Skip database generation fallback since it's causing 503 errors
      if (transformedForecastData.length === 0) {
        console.log('FALLBACK 2: Skipping database generation due to service unavailability (503 errors)')
      }
      
      // Final check and processing
      if (transformedForecastData.length === 0) {
        console.warn('NO NEW FORECAST DATA AVAILABLE from any source!')
        console.log('All forecast data sources failed:')
        console.log('1. POST /predict/forecast - failed')
        console.log('2. GET /solar-predictions/forecast - failed') 
        console.log('3. Database generation - skipped')
        
        // Keep existing data if we have it, otherwise show error
        if (currentForecastData && currentForecastData.length > 0) {
          console.log(`KEEPING EXISTING FORECAST DATA: ${currentForecastData.length} records`)
          console.log('Using cached forecast data to prevent empty chart')
          // Don't update forecastPredictions - keep existing data
          setApiStatus(prev => ({ ...prev, solar: 'cached' }))
        } else {
          console.error('No existing forecast data to fall back to')
          setApiStatus(prev => ({ ...prev, solar: 'error' }))
          setForecastPredictions([]) // Only clear if we have no fallback
        }
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
        console.log(`Real-time forecast window: ${windowLabel}`)
        console.log('Time range:', transformedForecastData.length > 0 ? 
          `${transformedForecastData[0].time} to ${transformedForecastData[transformedForecastData.length - 1].time}` : 'No data')
        console.log('Power range:', transformedForecastData.length > 0 ? 
          `${Math.min(...transformedForecastData.map(d => d.predictedPower)).toFixed(3)} - ${Math.max(...transformedForecastData.map(d => d.predictedPower)).toFixed(3)} kW` : 'No data')
        console.log(`Expected time window: ${forecastStartTime.toLocaleTimeString()} - ${forecastEndTime.toLocaleTimeString()}`)
        
        setApiStatus(prev => ({ ...prev, solar: 'connected' }))
        setForecastPredictions(transformedForecastData) // Only update with new data
      }
      
    } catch (err) {
      console.error('Error fetching forecast predictions:', err)
      setApiStatus(prev => ({ ...prev, solar: 'error' }))
    }
  }

  // Fetch dashboard summary (optional - skip if timeout)
  const fetchSummary = async () => {
    try {
      const data = await solarApi.getPredictionsSummary(null)
      setSummary(data)
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.warn('Summary API timeout - skipping (non-essential)')
      } else {
        console.warn('Error fetching summary:', err.message)
      }
    }
  }

  // Fetch database status (optional - skip if timeout)
  const fetchDatabaseStatus = async () => {
    try {
      const status = await solarApi.getDatabaseStatus()
      setDbStatus(status)
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.warn('Database status API timeout - skipping (non-essential)')
      } else {
        console.warn('Error fetching database status:', err.message)
      }
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
      console.warn('Battery API not available (404), keeping current level:', err.response?.status)
      // Keep existing battery level if API fails - this is expected if endpoint doesn't exist
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
      
      // Fetch essential data first
      await Promise.all([
        fetchWeatherData().catch(err => console.warn('Weather fetch failed:', err)),
        fetchRealtimePredictions().catch(err => console.warn('Realtime predictions failed:', err)),
        fetchForecastPredictions().catch(err => console.warn('Forecast predictions failed:', err))
      ])
      
      // Fetch non-essential data separately (don't block main dashboard)
      Promise.all([
        fetchSummary().catch(err => console.warn('Summary failed (non-essential):', err.message)),
        fetchDatabaseStatus().catch(err => console.warn('Database status failed (non-essential):', err.message))
      ]).catch(() => {
        // Ignore failures for non-essential data
        console.log('Non-essential data fetch completed with some failures')
      })
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Some services are unavailable. Using available data.')
    } finally {
      setLoading(false)
    }
  }

  // Real-time data updates with different intervals for different data types
  useEffect(() => {
    testAPIs()
    fetchAllData(true)
    
    // Quick updates for weather and real-time solar data every 30 seconds
    const quickInterval = setInterval(() => {
      console.log('Quick update (weather + realtime solar) triggered at:', new Date().toLocaleTimeString())
      
      if (shouldUpdateRollingWindow()) {
        console.log('HOURLY ROLLING WINDOW UPDATE - Fetching new 24-hour data window')
        Promise.all([
          fetchWeatherData().catch(err => console.warn('Weather fetch failed:', err)),
          fetchRealtimePredictions().catch(err => console.warn('Realtime predictions failed:', err))
        ])
        setLastUpdated(new Date())
      } else {
        console.log('Regular data refresh (weather + realtime solar)')
        Promise.all([
          fetchWeatherData().catch(err => console.warn('Weather fetch failed:', err)),
          fetchRealtimePredictions().catch(err => console.warn('Realtime predictions failed:', err))
        ])
      }
    }, 30000)
    
    // Solar forecast updates every 10 minutes
    const forecastInterval = setInterval(() => {
      console.log('Solar forecast update triggered at:', new Date().toLocaleTimeString())
      fetchForecastPredictions().catch(err => console.warn('Forecast predictions failed:', err))
    }, 600000) // Every 10 minutes (600,000 ms)
    
    // Guaranteed hourly updates for all data
    const hourlyInterval = setInterval(() => {
      const timeWindow = getRollingTimeWindow()
      console.log(`HOURLY WINDOW UPDATE: ${timeWindow.windowLabel}`)
      fetchAllData(false)
      setLastUpdated(new Date())
    }, 3600000) // Every hour

    return () => {
      clearInterval(quickInterval)
      clearInterval(forecastInterval)
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