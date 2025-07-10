import axios from 'axios'

// Configure Weather API URL
const WEATHER_API_URL = 'http://localhost:5000'

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
  // Fetch weather data from Weather API (port 5000)
  getWeatherData: async (limit = 20, dataType = 'forecast') => {
    try {
      // Try to get real data from Weather API first
      console.log('Attempting to fetch real weather data...')
      const response = await weatherApiInstance.get('/weather/data', {
        params: { limit }
      })
      console.log('Weather API: Real data received successfully')
      return response.data
    } catch (err) {
      try {
        // Try alternative endpoint
        console.log('Trying alternative weather endpoint...')
        const response = await weatherApiInstance.get('/weather-data', {
          params: { limit, data_type: dataType }
        })
        console.log('Weather API (alt): Real data received successfully')
        return response.data
      } catch (err2) {
        // Fall back to mock data if both endpoints fail
        console.log('Weather API unavailable, using mock data as fallback')
        return weatherApi.generateMockWeatherData(limit)
      }
    }
  },

  // Generate mock weather data when API is not available
  generateMockWeatherData: (limit = 20) => {
    const mockData = []
    const now = new Date()
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(now.getTime() - (limit - i - 1) * 5 * 60 * 1000) // 5 minutes intervals
      const hour = timestamp.getHours()
      
      // Generate realistic weather patterns
      const baseTemp = 25 + Math.sin((hour - 6) * Math.PI / 12) * 8 // Temperature curve
      const temperature = baseTemp + (Math.random() - 0.5) * 4
      
      mockData.push({
        id: i + 1,
        timestamp: timestamp.toISOString(),
        temperature: Math.round(temperature * 10) / 10,
        relative_humidity_2m: 60 + (Math.random() - 0.5) * 30,
        wind_speed_10m: 3 + Math.random() * 5,
        pressure_msl: 1013 + (Math.random() - 0.5) * 20,
        cloud_cover: Math.random() * 100,
        direct_normal_irradiance: hour >= 6 && hour <= 18 ? 
          Math.max(0, 800 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 200) : 0,
        latitude: 6.86666,
        longitude: 80.01667,
        data_type: 'forecast'
      })
    }
    
    return mockData
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