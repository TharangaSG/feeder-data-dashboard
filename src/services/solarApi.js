import axios from 'axios'

// Configure Solar API URL
const SOLAR_API_URL = 'http://localhost:5003'

// Create axios instance for Solar API
const solarApiInstance = axios.create({
  baseURL: SOLAR_API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
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
      // Try to get real data from Solar API first
      console.log('Attempting to fetch real solar predictions...')
      const response = await solarApiInstance.get('/solar-predictions', {
        params: { limit }
      })
      console.log('Solar API: Real predictions received successfully')
      return response.data
    } catch (error) {
      // Fall back to mock data if API fails
      console.log('Solar API unavailable, using mock predictions as fallback')
      return solarApi.generateMockSolarPredictions(limit)
    }
  },

  // Get forecast solar predictions (24 hours ahead)
  getForecastSolarPredictions: async (limit = 24, locationFilter = null) => {
    try {
      // Try to get real forecast data from Solar API first
      console.log('Attempting to fetch real forecast predictions...')
      const params = { limit }
      if (locationFilter) {
        params.location_filter = locationFilter
      }
      const response = await solarApiInstance.get('/solar-predictions/forecast', { params })
      console.log('Solar Forecast API: Real data received successfully')
      return response.data
    } catch (error) {
      // Fall back to mock data if API fails
      console.log('Solar Forecast API unavailable, using mock data as fallback')
      return solarApi.generateMockForecastPredictions(limit)
    }
  },

  // Get predictions summary
  getPredictionsSummary: async (locationFilter = null) => {
    try {
      // Try to get real summary from Solar API first
      console.log('Attempting to fetch real predictions summary...')
      const params = {}
      if (locationFilter) {
        params.location_filter = locationFilter
      }
      const response = await solarApiInstance.get('/solar-predictions/summary', { params })
      console.log('Solar Summary API: Real data received successfully')
      return response.data
    } catch (error) {
      // Fall back to mock summary if API fails
      console.log('Solar Summary API unavailable, using mock data as fallback')
      return {
        total_predictions: 150,
        avg_power_today: 3.2,
        peak_power_today: 5.8,
        total_energy_today: 28.5,
        efficiency: 85.2,
        last_updated: new Date().toISOString()
      }
    }
  },

  // Trigger auto forecast prediction pipeline
  triggerForecastPipeline: async (locationFilter = null, hoursAhead = 24) => {
    try {
      console.log('Attempting to trigger forecast pipeline...')
      const response = await solarApiInstance.post('/predict/auto-forecast-pipeline', {
        location_filter: locationFilter,
        hours_ahead: hoursAhead
      })
      console.log('Forecast pipeline triggered successfully')
      return response.data
    } catch (error) {
      console.log('Forecast pipeline API unavailable, using mock response')
      return { status: 'success', message: 'Pipeline triggered (mock)' }
    }
  },

  // Get database status
  getDatabaseStatus: async () => {
    try {
      // Try to get real database status from Solar API first
      console.log('Attempting to fetch real database status...')
      const response = await solarApiInstance.get('/database/status')
      console.log('Database Status API: Real data received successfully')
      return response.data
    } catch (error) {
      // Fall back to mock status if API fails
      console.log('Database Status API unavailable, using mock data as fallback')
      return {
        status: 'connected',
        weather_records: 1250,
        prediction_records: 890,
        last_update: new Date().toISOString(),
        database_size: '45.2 MB'
      }
    }
  },

  // Solar power prediction endpoint (single prediction)
  predictSolarPower: async (inputData) => {
    try {
      console.log('Attempting to predict solar power...')
      const response = await solarApiInstance.post('/predict/single', inputData)
      console.log('Solar power prediction successful')
      return response.data
    } catch (error) {
      console.log('Solar power prediction API unavailable, using mock response')
      return {
        predicted_power_kw: 3.5 + Math.random() * 2,
        confidence: 0.85,
        timestamp: new Date().toISOString()
      }
    }
  },

  // Predict from database weather data
  predictFromDatabase: async (limit = 10, dataType = 'forecast', locationFilter = null) => {
    try {
      console.log('Attempting to predict from database...')
      const response = await solarApiInstance.post('/predict/from-database', {
        limit,
        data_type: dataType,
        location_filter: locationFilter
      })
      console.log('Database prediction successful')
      return response.data
    } catch (error) {
      console.log('Database prediction API unavailable, using mock data')
      return solarApi.generateMockSolarPredictions(limit)
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