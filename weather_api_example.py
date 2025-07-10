"""
Example Weather API with CORS configuration
Save this as weather_api_example.py and run with:
uvicorn weather_api_example:app --host 0.0.0.0 --port 5000 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

app = FastAPI(
    title="Weather API",
    description="Weather data API for Solar Dashboard",
    version="1.0.0"
)

# CORS Configuration - THIS IS THE IMPORTANT PART
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:3000",  # Alternative React port
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Pydantic models
class WeatherData(BaseModel):
    id: int
    timestamp: datetime
    temperature: float
    relative_humidity_2m: float
    wind_speed_10m: float
    pressure_msl: float
    cloud_cover: float
    direct_normal_irradiance: float
    latitude: float
    longitude: float
    data_type: str

@app.get("/")
async def root():
    return {
        "message": "Weather API is running",
        "status": "ok",
        "endpoints": [
            "/weather/data",
            "/weather-data"
        ]
    }

@app.get("/weather/data", response_model=List[WeatherData])
async def get_weather_data(limit: int = 20):
    """Get weather data - primary endpoint"""
    return generate_sample_weather_data(limit)

@app.get("/weather-data", response_model=List[WeatherData])
async def get_weather_data_alternative(limit: int = 20, data_type: str = "forecast"):
    """Get weather data - alternative endpoint for compatibility"""
    return generate_sample_weather_data(limit, data_type)

def generate_sample_weather_data(limit: int, data_type: str = "forecast") -> List[WeatherData]:
    """Generate sample weather data"""
    base_time = datetime.now()
    data = []
    
    for i in range(limit):
        # Generate realistic weather data with some variation
        timestamp = base_time + timedelta(hours=i)
        
        # Temperature varies throughout the day
        hour = timestamp.hour
        base_temp = 20 + 10 * abs(12 - hour) / 12  # Peak at noon
        temperature = base_temp + random.uniform(-3, 3)
        
        # Other weather parameters
        humidity = 60 + random.uniform(-20, 20)
        wind_speed = 5 + random.uniform(-2, 5)
        pressure = 1013 + random.uniform(-10, 10)
        cloud_cover = random.uniform(0, 100)
        
        # Solar irradiance depends on time of day and cloud cover
        if 6 <= hour <= 18:  # Daylight hours
            max_irradiance = 1000 * (1 - cloud_cover / 100)
            time_factor = abs(12 - hour) / 6  # Peak at noon
            irradiance = max_irradiance * (1 - time_factor) + random.uniform(-50, 50)
        else:
            irradiance = 0
        
        irradiance = max(0, irradiance)  # Ensure non-negative
        
        weather_point = WeatherData(
            id=i + 1,
            timestamp=timestamp,
            temperature=round(temperature, 1),
            relative_humidity_2m=round(max(0, min(100, humidity)), 1),
            wind_speed_10m=round(max(0, wind_speed), 1),
            pressure_msl=round(pressure, 1),
            cloud_cover=round(max(0, min(100, cloud_cover)), 1),
            direct_normal_irradiance=round(irradiance, 1),
            latitude=6.86666,  # Colombo, Sri Lanka
            longitude=80.01667,
            data_type=data_type
        )
        
        data.append(weather_point)
    
    return data

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)