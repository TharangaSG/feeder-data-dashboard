#!/usr/bin/env python3
"""
Quick test script to verify CORS is working
Run this after starting your APIs with CORS fixes
"""

import requests
import json

def test_weather_api():
    """Test Weather API CORS"""
    try:
        # Test basic endpoint
        response = requests.get('http://localhost:5000/')
        print(f"✅ Weather API Root: {response.status_code} - {response.json()}")
        
        # Test weather data endpoint
        response = requests.get('http://localhost:5000/weather/data?limit=5')
        print(f"✅ Weather Data: {response.status_code} - Got {len(response.json())} records")
        
        # Test CORS headers
        response = requests.options('http://localhost:5000/weather/data', 
                                  headers={'Origin': 'http://localhost:5173'})
        cors_headers = response.headers.get('Access-Control-Allow-Origin')
        print(f"✅ CORS Headers: {cors_headers}")
        
    except Exception as e:
        print(f"❌ Weather API Error: {e}")

def test_solar_api():
    """Test Solar API CORS"""
    try:
        # Test basic endpoint
        response = requests.get('http://localhost:5003/')
        print(f"✅ Solar API Root: {response.status_code} - {response.json()}")
        
        # Test solar predictions
        response = requests.get('http://localhost:5003/solar-predictions?limit=5')
        print(f"✅ Solar Predictions: {response.status_code} - Got {len(response.json())} records")
        
        # Test database status
        response = requests.get('http://localhost:5003/database/status')
        print(f"✅ Database Status: {response.status_code} - {response.json()}")
        
        # Test CORS headers
        response = requests.options('http://localhost:5003/solar-predictions', 
                                  headers={'Origin': 'http://localhost:5173'})
        cors_headers = response.headers.get('Access-Control-Allow-Origin')
        print(f"✅ CORS Headers: {cors_headers}")
        
    except Exception as e:
        print(f"❌ Solar API Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing CORS Configuration...")
    print("\n📡 Testing Weather API (Port 5000):")
    test_weather_api()
    
    print("\n☀️ Testing Solar API (Port 5003):")
    test_solar_api()
    
    print("\n✅ Test completed! Check for any ❌ errors above.")