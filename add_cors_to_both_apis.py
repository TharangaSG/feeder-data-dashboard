#!/usr/bin/env python3
"""
Add this CORS configuration to BOTH your APIs to fix all CORS errors
"""

# ADD THIS TO YOUR WEATHER API (port 5000) AND SOLAR API (port 5003)

from fastapi.middleware.cors import CORSMiddleware

# Add this to your existing FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dashboard
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("CORS configuration added - restart your APIs after adding this code!")