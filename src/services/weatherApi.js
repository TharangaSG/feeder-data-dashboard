import axios from 'axios'

// Configure Weather API URL (Weather Data Collection API)
const WEATHER_API_URL = 'http://localhost:5003'

// Create axios instance for Weather API
const weatherApiInstance = axios.create({
  baseURL: WEATHER_API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
})

// Add request interceptor for logging
weatherApiInstance.interceptors.request.use(
  (config) => {
    console.log(`Making Weather API request to: ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('Weather API Request error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
weatherApiInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('Weather API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Weather API functions
export const weatherApi = {
  // Fetch weather data from Weather API (port 5003)
  getWeatherData: async (limit = 20, dataType = 'forecast', latitude = null, longitude = null) => {
    try {
      console.log('Fetching real weather data from /weather/data...')
      const params = { limit }
      
      if (latitude !== null) params.latitude = latitude
      if (longitude !== null) params.longitude = longitude
      if (dataType) params.data_type = dataType
      
      const response = await weatherApiInstance.get('/weather/data', { params })
      console.log('Weather API: Real data received successfully')
      return response.data
    } catch (error) {
      console.error('Weather API error:', error)
      throw error
    }
  },

  // Get latest weather data for a specific location
  getLatestWeatherData: async (latitude, longitude, hours = 24) => {
    try {
      console.log('Fetching latest weather data...')
      const response = await weatherApiInstance.get('/weather/latest', {
        params: { 
          latitude, 
          longitude, 
          hours,
          _t: Date.now() // Cache busting parameter
        }
      })
      console.log('Latest weather data received successfully')
      return response.data
    } catch (error) {
      console.error('Latest weather API error:', error)
      throw error
    }
  },

  // Get raw forecast data without storing in database
  getRawForecastData: async (latitude, longitude, hours = 5) => {
    try {
      console.log('Fetching raw forecast data...')
      const response = await weatherApiInstance.get('/weather/forecast/raw', {
        params: { latitude, longitude, hours }
      })
      console.log('Raw forecast data received successfully')
      return response.data
    } catch (error) {
      console.error('Raw forecast API error:', error)
      throw error
    }
  },

  // Collect weather data for a location (sync)
  collectWeatherDataSync: async (latitude, longitude) => {
    try {
      console.log('Collecting weather data synchronously...')
      const response = await weatherApiInstance.post('/weather/collect/sync', {
        latitude,
        longitude
      })
      console.log('Weather data collection completed')
      return response.data
    } catch (error) {
      console.error('Weather collection error:', error)
      throw error
    }
  },

  // Get humidity data for charting
  getHumidityData: async (latitude, longitude, startDate = null, endDate = null) => {
    try {
      console.log('Fetching humidity data...')
      const params = { latitude, longitude }
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      
      const response = await weatherApiInstance.get('/api/humidity', { params })
      console.log('Humidity data received successfully')
      return response.data
    } catch (error) {
      console.error('Humidity API error:', error)
      throw error
    }
  },

  // Test weather API connection
  testConnection: async () => {
    try {
      const response = await weatherApiInstance.get('/')
      return response.data
    } catch (error) {
      console.error('Weather API connection test failed:', error)
      throw error
    }
  }
}

export default weatherApiInstance