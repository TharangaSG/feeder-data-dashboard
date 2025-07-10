# Solar Energy Dashboard

A modern React dashboard for monitoring solar energy generation and battery status with real-time data visualization.

## Features

- **Battery Indicator**: Visual battery level display with color-coded status
- **Solar Generation Chart**: Real-time line chart showing power generation over time
- **Statistics Grid**: Key metrics including current generation, daily totals, efficiency, and CO₂ offset
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Simulated live data updates every 5 seconds

## Components

### 1. BatteryIndicator.jsx
- Visual battery representation with fill level
- Color-coded status (green/yellow/red)
- Battery percentage and status text
- Estimated time remaining

### 2. SolarChart.jsx
- Line chart using Chart.js and react-chartjs-2
- Real-time solar generation data
- Smooth animations and hover effects
- Responsive design with proper scaling

### 3. StatsGrid.jsx
- Grid layout of key statistics
- Current generation, daily totals, efficiency
- CO₂ offset calculations
- Color-coded values based on performance

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Chart.js**: Powerful charting library
- **react-chartjs-2**: React wrapper for Chart.js
- **CSS3**: Modern styling with gradients and glassmorphism effects

## Data Simulation

The dashboard includes realistic data simulation:
- Solar generation follows a bell curve during daylight hours (6 AM - 6 PM)
- Battery level fluctuates realistically
- Statistics are calculated based on current values
- Updates occur every 5 seconds for real-time feel

## Customization

You can easily customize:
- Update intervals in `App.jsx`
- Chart colors and styling in `SolarChart.jsx`
- Battery thresholds in `BatteryIndicator.jsx`
- Add new statistics in `StatsGrid.jsx`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.# feeder-data-dashboard
