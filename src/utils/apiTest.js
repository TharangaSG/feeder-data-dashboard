// API Test Utility
import { weatherApi } from '../services/weatherApi'
import { solarApi } from '../services/solarApi'

export const testAPIs = async () => {
  console.log('🧪 Testing API Connections...')
  
  const results = {
    weather: { status: 'pending', error: null, data: null },
    solar: { status: 'pending', error: null, data: null }
  }

  // Test Weather API
  try {
    console.log('📡 Testing Weather API (port 5000)...')
    const weatherData = await weatherApi.getWeatherData(5)
    results.weather.status = 'success'
    results.weather.data = weatherData
    console.log('✅ Weather API: SUCCESS', weatherData)
  } catch (error) {
    results.weather.status = 'failed'
    results.weather.error = error.message
    console.log('❌ Weather API: FAILED', error.message)
  }

  // Test Solar API
  try {
    console.log('📡 Testing Solar API (port 5003)...')
    const solarStatus = await solarApi.getDatabaseStatus()
    results.solar.status = 'success'
    results.solar.data = solarStatus
    console.log('✅ Solar API: SUCCESS', solarStatus)
  } catch (error) {
    results.solar.status = 'failed'
    results.solar.error = error.message
    console.log('❌ Solar API: FAILED', error.message)
  }

  return results
}

export const testWeatherEndpoints = async () => {
  console.log('🌤️ Testing Weather API Endpoints...')
  
  const endpoints = [
    { name: 'Weather Data', fn: () => weatherApi.getWeatherData(5) },
    { name: 'Connection Test', fn: () => weatherApi.testConnection() }
  ]

  for (const endpoint of endpoints) {
    try {
      const result = await endpoint.fn()
      console.log(`✅ ${endpoint.name}:`, result)
    } catch (error) {
      console.log(`❌ ${endpoint.name}:`, error.message)
    }
  }
}

export const testSolarEndpoints = async () => {
  console.log('☀️ Testing Solar API Endpoints...')
  
  const endpoints = [
    { name: 'Database Status', fn: () => solarApi.getDatabaseStatus() },
    { name: 'Solar Predictions', fn: () => solarApi.getSolarPredictions(5) },
    { name: 'Forecast Predictions', fn: () => solarApi.getForecastSolarPredictions(5) },
    { name: 'Predictions Summary', fn: () => solarApi.getPredictionsSummary() }
  ]

  for (const endpoint of endpoints) {
    try {
      const result = await endpoint.fn()
      console.log(`✅ ${endpoint.name}:`, result)
    } catch (error) {
      console.log(`❌ ${endpoint.name}:`, error.message)
    }
  }
}