import axios from 'axios'

// Configure Solar API URL
const SOLAR_API_URL = 'http://localhost:5003'

// Create axios instance for Solar API
const solarApiInstance = axios.create({
  baseURL: SOLAR_API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for logging
solarApiInstance.interceptors.request.use(
  (config) => {
    console.log(`Making Solar API request to: ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('Solar API Request error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
solarApiInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('Solar API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Solar API functions
export const solarApi = {
  // Get solar predictions from database
  getSolarPredictions: async (limit = 24) => {
    try {
      const response = await solarApiInstance.get('/solar-predictions', {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching solar predictions, using mock data:', error)
      return solarApi.generateMockSolarPredictions(limit)
    }
  },

  // Get forecast solar predictions (24 hours ahead)
  getForecastSolarPredictions: async (limit = 24, locationFilter = null) => {
    try {
      const params = { limit }
      if (locationFilter) {
        params.location_filter = locationFilter
      }
      const response = await solarApiInstance.get('/solar-predictions/forecast', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching forecast solar predictions, using mock data:', error)
      return solarApi.generateMockForecastPredictions(limit)
    }
  },

  // Get predictions summary
  getPredictionsSummary: async (locationFilter = null) => {
    try {
      const params = {}
      if (locationFilter) {
        params.location_filter = locationFilter
      }
      const response = await solarApiInstance.get('/solar-predictions/summary', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching predictions summary:', error)
      throw error
    }
  },

  // Trigger auto forecast prediction pipeline
  triggerForecastPipeline: async (locationFilter = null, hoursAhead = 24) => {
    try {
      const response = await solarApiInstance.post('/predict/auto-forecast-pipeline', {
        location_filter: locationFilter,
        hours_ahead: hoursAhead
      })
      return response.data
    } catch (error) {
      console.error('Error triggering forecast pipeline:', error)
      throw error
    }
  },

  // Get database status
  getDatabaseStatus: async () => {
    try {
      const response = await solarApiInstance.get('/database/status')
      return response.data
    } catch (error) {
      console.error('Error fetching database status:', error)
      throw error
    }
  },

  // Solar power prediction endpoint (single prediction)
  predictSolarPower: async (inputData) => {
    try {
      const response = await solarApiInstance.post('/predict/single', inputData)
      return response.data
    } catch (error) {
      console.error('Error predicting solar power:', error)
      throw error
    }
  },

  // Predict from database weather data
  predictFromDatabase: async (limit = 10, dataType = 'forecast', locationFilter = null) => {
    try {
      const response = await solarApiInstance.post('/predict/from-database', {
        limit,
        data_type: dataType,
        location_filter: locationFilter
      })
      return response.data
    } catch (error) {
      console.error('Error predicting from database:', error)
      throw error
    }
  },

  // Generate mock solar predictions when API is not available
  generateMockSolarPredictions: (limit = 24) => {
    const mockData = []
    const now = new Date()
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(now.getTime() - (limit - i - 1) * 5 * 60 * 1000) // 5 minutes intervals
      const hour = timestamp.getHours()
      
      // Generate realistic solar power patterns based on time of day
      let basePower = 0
      if (hour >= 6 && hour <= 18) {
        // Daytime solar generation curve
        const solarCurve = Math.sin((hour - 6) * Math.PI / 12)
        basePower = Math.max(0, solarCurve * 5 + (Math.random() - 0.5) * 1) // 0-5 kW range
      }
      
      mockData.push({
        id: i + 1,
        timestamp: timestamp.toISOString(),
        predicted_power_kw: Math.round(basePower * 100) / 100,
        weather_conditions: {
          temperature: 25 + Math.sin((hour - 6) * Math.PI / 12) * 8 + (Math.random() - 0.5) * 3,
          relative_humidity_2m: 60 + (Math.random() - 0.5) * 20,
          wind_speed_10m: 3 + Math.random() * 4,
          cloud_cover: Math.random() * 60,
          direct_normal_irradiance: hour >= 6 && hour <= 18 ? 
            Math.max(0, 800 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 200) : 0
        },
        location: {
          latitude: 6.86666,
          longitude: 80.01667
        }
      })
    }
    
    return mockData
  },

  // Generate mock forecast predictions
  generateMockForecastPredictions: (limit = 24) => {
    const mockData = []
    const now = new Date()
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000) // 1 hour intervals
      const hour = timestamp.getHours()
      
      // Generate realistic solar power forecast patterns
      let basePower = 0
      if (hour >= 6 && hour <= 18) {
        const solarCurve = Math.sin((hour - 6) * Math.PI / 12)
        basePower = Math.max(0, solarCurve * 6 + (Math.random() - 0.5) * 1.5) // 0-6 kW range for forecast
      }
      
      mockData.push({
        id: i + 1,
        timestamp: timestamp.toISOString(),
        predicted_power_kw: Math.round(basePower * 100) / 100,
        weather_conditions: {
          temperature: 26 + Math.sin((hour - 6) * Math.PI / 12) * 7 + (Math.random() - 0.5) * 2,
          relative_humidity_2m: 55 + (Math.random() - 0.5) * 25,
          wind_speed_10m: 2.5 + Math.random() * 3,
          cloud_cover: Math.random() * 50,
          direct_normal_irradiance: hour >= 6 && hour <= 18 ? 
            Math.max(0, 850 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 150) : 0
        },
        location: {
          latitude: 6.86666,
          longitude: 80.01667
        },
        forecast_type: 'hourly'
      })
    }
    
    return mockData
  },

  // Test solar API connection
  testConnection: async () => {
    try {
      const response = await solarApiInstance.get('/')
      return response.data
    } catch (error) {
      console.error('Solar API connection test failed:', error)
      throw error
    }
  }
}

export default solarApiInstance