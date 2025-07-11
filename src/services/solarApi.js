import axios from 'axios'

// Configure Solar API URL (Solar Power Prediction API)
const SOLAR_API_URL = 'http://localhost:5000'

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
    console.log('Fetching real solar predictions from /solar-predictions...')
    const response = await solarApiInstance.get('/solar-predictions', {
      params: { 
        limit,
        _t: Date.now() // Cache busting parameter
      }
    })
    console.log('Solar API: Real predictions received successfully')
    return response.data
  },

  // Get forecast solar predictions (24 hours ahead)
  getForecastSolarPredictions: async (limit = 24, locationFilter = null) => {
    console.log('Fetching real forecast predictions from /solar-predictions/forecast...')
    const params = { 
      limit,
      _t: Date.now() // Cache busting parameter
    }
    if (locationFilter) {
      params.location_filter = locationFilter
    }
    const response = await solarApiInstance.get('/solar-predictions/forecast', { params })
    console.log('Solar Forecast API: Real data received successfully')
    return response.data
  },

  // Get predictions summary
  getPredictionsSummary: async (locationFilter = null) => {
    console.log('Fetching real predictions summary from /solar-predictions/summary...')
    const params = {}
    if (locationFilter) {
      params.location_filter = locationFilter
    }
    const response = await solarApiInstance.get('/solar-predictions/summary', { params })
    console.log('Solar Summary API: Real data received successfully')
    return response.data
  },

  // Trigger auto forecast prediction pipeline
  triggerForecastPipeline: async (locationFilter = null, hoursAhead = 24) => {
    console.log('Triggering forecast pipeline...')
    const response = await solarApiInstance.post('/predict/auto-forecast-pipeline', {
      location_filter: locationFilter,
      hours_ahead: hoursAhead
    })
    console.log('Forecast pipeline triggered successfully')
    return response.data
  },

  // Get database status
  getDatabaseStatus: async () => {
    console.log('Fetching real database status from /database/status...')
    const response = await solarApiInstance.get('/database/status')
    console.log('Database Status API: Real data received successfully')
    return response.data
  },

  // Solar power prediction endpoint (single prediction)
  predictSolarPower: async (inputData) => {
    console.log('Predicting solar power...')
    const response = await solarApiInstance.post('/predict/single', inputData)
    console.log('Solar power prediction successful')
    return response.data
  },

  // Predict from database weather data
  predictFromDatabase: async (limit = 10, dataType = 'forecast', locationFilter = null) => {
    console.log('Predicting from database...')
    const response = await solarApiInstance.post('/predict/from-database', {
      limit,
      data_type: dataType,
      location_filter: locationFilter
    })
    console.log('Database prediction successful')
    return response.data
  },

  // Predict with forecast data (real-time forecast predictions)
  predictWithForecast: async (latitude, longitude, hours = 24) => {
    console.log('Predicting with forecast data...')
    const response = await solarApiInstance.post('/predict/forecast', {
      latitude,
      longitude,
      hours
    })
    console.log('Forecast prediction successful')
    return response.data
  },

  // Predict from forecast data in database
  predictFromForecastDatabase: async (locationFilter = null, limit = 24) => {
    console.log('Predicting from forecast database...')
    const params = { limit }
    if (locationFilter) {
      params.location_filter = locationFilter
    }
    const response = await solarApiInstance.post('/predict/forecast-from-database', params)
    console.log('Forecast database prediction successful')
    return response.data
  },


  // Clear solar predictions
  clearSolarPredictions: async () => {
    console.log('Clearing solar predictions...')
    const response = await solarApiInstance.delete('/solar-predictions/clear')
    console.log('Solar predictions cleared successfully')
    return response.data
  },

  // Predict from database
  predictFromDatabase: async (limit = 20, dataType = 'forecast', locationFilter = null) => {
    console.log('Triggering predictions from database...')
    const response = await solarApiInstance.post('/predict/from-database', {
      limit,
      data_type: dataType,
      location_filter: locationFilter
    })
    console.log('Database predictions completed successfully')
    return response.data
  },

  // Get battery status/level
  getBatteryStatus: async () => {
    console.log('Fetching real battery status from /battery/status...')
    const response = await solarApiInstance.get('/battery/status')
    console.log('Battery status received successfully')
    return response.data
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