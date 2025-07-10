import React from 'react'

const BatteryIndicator = ({ level }) => {
  const getBatteryColor = (level) => {
    if (level > 60) return '#4ade80' // Green
    if (level > 30) return '#fbbf24' // Yellow
    return '#ef4444' // Red
  }

  const getBatteryStatus = (level) => {
    if (level > 80) return 'Excellent'
    if (level > 60) return 'Good'
    if (level > 30) return 'Fair'
    if (level > 15) return 'Low'
    return 'Critical'
  }

  const batteryColor = getBatteryColor(level)
  const batteryStatus = getBatteryStatus(level)

  return (
    <div className="battery-container">
      {/* Battery Visual */}
      <div style={{ position: 'relative', width: '120px', height: '60px' }}>
        {/* Battery Body */}
        <div
          style={{
            width: '100px',
            height: '60px',
            border: '3px solid white',
            borderRadius: '8px',
            position: 'relative',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Battery Fill */}
          <div
            style={{
              width: `${level}%`,
              height: '100%',
              backgroundColor: batteryColor,
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              boxShadow: `0 0 10px ${batteryColor}`,
            }}
          />
          
          {/* Battery Level Text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              zIndex: 10,
            }}
          >
            {Math.round(level)}%
          </div>
        </div>
        
        {/* Battery Terminal */}
        <div
          style={{
            position: 'absolute',
            right: '-8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '20px',
            backgroundColor: 'white',
            borderRadius: '0 3px 3px 0',
          }}
        />
      </div>

      {/* Battery Level Display */}
      <div className="battery-level" style={{ color: batteryColor }}>
        {Math.round(level)}%
      </div>

      {/* Battery Status */}
      <div className="battery-status">
        Status: {batteryStatus}
      </div>

      {/* Additional Battery Info */}
      <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
        <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
          Estimated Time: {level > 20 ? `${Math.round(level / 5)} hours` : 'Low'}
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          {level > 90 ? '🔋 Fully Charged' : 
           level > 20 ? '⚡ Charging' : 
           '⚠️ Needs Charging'}
        </div>
      </div>
    </div>
  )
}

export default BatteryIndicator