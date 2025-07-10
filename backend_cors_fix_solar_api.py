# Solar API with CORS Fix (Port 5003)
# Save this as your solar API main file (e.g., solar_main.py)

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import json
from datetime import datetime, timedelta
import random
import math

app = FastAPI(title="Solar API", description="Solar prediction API with CORS support")

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
        "message": "Solar API is running", 
        "status": "ok",
        "cors": "enabled",
        "endpoints": ["/solar-predictions", "/solar-predictions/forecast", "/database/status"]
    }

@app.get("/solar-predictions")
async def get_solar_predictions(limit: int = Query(24, ge=1, le=100)):
    """Get real-time solar predictions"""
    return generate_realtime_predictions(limit)

@app.get("/solar-predictions/forecast")
async def get_forecast_predictions(limit: int = Query(24, ge=1, le=100)):
    """Get 24-hour forecast predictions"""
    return generate_forecast_predictions(limit)

@app.get("/solar-predictions/summary")
async def get_predictions_summary():
    """Get predictions summary"""
    return {
        "total_predictions": 150,
        "avg_power_today": 3.2,
        "peak_power_today": 5.8,
        "total_energy_today": 28.5,
        "efficiency": 85.2,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/database/status")
async def get_database_status():
    """Get database status"""
    return {
        "status": "connected",
        "weather_records": 1250,
        "prediction_records": 890,
        "last_update": datetime.now().isoformat(),
        "database_size": "45.2 MB"
    }

def generate_realtime_predictions(limit: int = 24):
    """Generate realistic real-time solar predictions"""
    data = []
    now = datetime.now()
    
    for i in range(limit):
        # Create timestamps going backwards from now (recent data)
        timestamp = now - timedelta(minutes=(limit - i - 1) * 5)
        hour = timestamp.hour
        
        # Generate realistic solar power based on time of day
        if 6 <= hour <= 18:
            solar_curve = math.sin((hour - 6) * math.pi / 12)
            base_power = solar_curve * 5  # 0-5 kW range
            predicted_power = max(0, base_power + random.uniform(-0.5, 0.5))
        else:
            predicted_power = 0
        
        # Generate correlated weather conditions
        temp = 25 + math.sin((hour - 6) * math.pi / 12) * 8 + random.uniform(-2, 2)
        humidity = max(30, min(90, 60 + random.uniform(-15, 15)))
        
        data.append({
            "id": i + 1,
            "timestamp": timestamp.isoformat(),
            "predicted_power_kw": round(predicted_power, 2),
            "weather_conditions": {
                "temperature": round(temp, 1),
                "relative_humidity_2m": round(humidity, 1),
                "wind_speed_10m": round(3 + random.uniform(-1, 2), 1),
                "cloud_cover": round(random.uniform(0, 60), 1),
                "direct_normal_irradiance": round(max(0, 800 * math.sin((hour - 6) * math.pi / 12)) if 6 <= hour <= 18 else 0, 1)
            },
            "location": {
                "latitude": 6.86666,
                "longitude": 80.01667
            }
        })
    
    return data

def generate_forecast_predictions(limit: int = 24):
    """Generate realistic forecast predictions"""
    data = []
    now = datetime.now()
    
    for i in range(limit):
        # Create timestamps going forward from now (forecast data)
        timestamp = now + timedelta(hours=i)
        hour = timestamp.hour
        
        # Generate realistic solar power forecast
        if 6 <= hour <= 18:
            solar_curve = math.sin((hour - 6) * math.pi / 12)
            base_power = solar_curve * 6  # 0-6 kW range for forecast
            predicted_power = max(0, base_power + random.uniform(-0.8, 0.8))
        else:
            predicted_power = 0
        
        # Generate forecast weather conditions
        temp = 26 + math.sin((hour - 6) * math.pi / 12) * 7 + random.uniform(-1.5, 1.5)
        humidity = max(35, min(85, 55 + random.uniform(-12, 12)))
        
        data.append({
            "id": i + 1,
            "timestamp": timestamp.isoformat(),
            "predicted_power_kw": round(predicted_power, 2),
            "weather_conditions": {
                "temperature": round(temp, 1),
                "relative_humidity_2m": round(humidity, 1),
                "wind_speed_10m": round(2.5 + random.uniform(-0.5, 2), 1),
                "cloud_cover": round(random.uniform(0, 50), 1),
                "direct_normal_irradiance": round(max(0, 850 * math.sin((hour - 6) * math.pi / 12)) if 6 <= hour <= 18 else 0, 1)
            },
            "location": {
                "latitude": 6.86666,
                "longitude": 80.01667
            },
            "forecast_type": "hourly"
        })
    
    return data

if __name__ == "__main__":
    import uvicorn
    print("Starting Solar API with CORS support on port 5003...")
    uvicorn.run(app, host="0.0.0.0", port=5003, reload=True)