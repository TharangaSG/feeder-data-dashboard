# CORS Fix for Solar API (Port 5000)
# Add this CORS middleware to your existing Solar API code

from fastapi.middleware.cors import CORSMiddleware

# Add this right after creating your FastAPI app instance
# app = FastAPI(...)

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

# This should be added to your existing Solar API code (the one running on port 5000)
# that contains endpoints like:
# - /solar-predictions
# - /solar-predictions/forecast
# - /database/status
# - /predict/forecast
# etc.