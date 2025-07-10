# Weather API with CORS Fix (Port 5000)
# Save this as your weather API main file (e.g., weather_main.py)

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
from datetime import datetime, timedelta
import random
import math

app = FastAPI(title="Weather API", description="Weather data API with CORS support")

# CORS Configuration - THIS IS THE KEY FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server (Vite)
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:3000",  # Alternative React port
        "http://localhost:5174",  # Alternative Vite port
        "http://localhost:8080",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Weather API is running", 
        "status": "ok",
        "cors": "enabled",
        "endpoints": ["/weather/data", "/weather-data"]
    }

@app.get("/weather/data")
async def get_weather_data(limit: int = Query(20, ge=1, le=100)):
    """Main weather data endpoint"""
    return generate_weather_data(limit)

@app.get("/weather-data") 
async def get_weather_data_alt(limit: int = Query(20, ge=1, le=100), data_type: str = "forecast"):
    """Alternative weather data endpoint"""
    return generate_weather_data(limit)

def generate_weather_data(limit: int = 20):
    """Generate realistic weather data"""
    data = []
    now = datetime.now()
    
    for i in range(limit):
        # Create timestamps going backwards from now
        timestamp = now - timedelta(minutes=(limit - i - 1) * 5)
        hour = timestamp.hour
        
        # Generate realistic weather patterns
        base_temp = 25 + math.sin((hour - 6) * math.pi / 12) * 8  # Temperature curve
        temperature = base_temp + random.uniform(-2, 2)
        
        # Generate correlated weather data
        humidity = max(30, min(90, 60 + random.uniform(-15, 15)))
        wind_speed = max(0, 3 + random.uniform(-1, 3))
        pressure = 1013 + random.uniform(-10, 10)
        cloud_cover = random.uniform(0, 80)
        
        # Solar irradiance based on time of day and cloud cover
        if 6 <= hour <= 18:
            base_irradiance = 800 * math.sin((hour - 6) * math.pi / 12)
            cloud_factor = (100 - cloud_cover) / 100
            irradiance = max(0, base_irradiance * cloud_factor + random.uniform(-50, 50))
        else:
            irradiance = 0
        
        data.append({
            "id": i + 1,
            "timestamp": timestamp.isoformat(),
            "temperature": round(temperature, 1),
            "relative_humidity_2m": round(humidity, 1),
            "wind_speed_10m": round(wind_speed, 1),
            "pressure_msl": round(pressure, 1),
            "cloud_cover": round(cloud_cover, 1),
            "direct_normal_irradiance": round(irradiance, 1),
            "latitude": 6.86666,
            "longitude": 80.01667,
            "data_type": "forecast"
        })
    
    return data

if __name__ == "__main__":
    import uvicorn
    print("Starting Weather API with CORS support on port 5000...")
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)