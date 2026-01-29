import { useState } from 'react';
import { Star, Plane } from 'lucide-react'; 
import './FlightCard.css';

function FlightCard({ flight, searchDate }) {
  const formattedDate = searchDate instanceof Date 
    ? searchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : searchDate;

  const [showDetails, setShowDetails] = useState(true);

  return (
    <div className="flight-card">
      {/* Top Main Section */}
      <div className="flight-main">  
        <div className="card-column">
          <span className="mobile-label">Airlines</span>
          <div className="flight-airline"> 
            <div className="airline-logo-text">{flight.logo}</div>
            <div className="airline-info">
              <div className="airline-name">{flight.airline}</div>
              <div className="flight-number">{flight.flightNumber}</div>
              <div className="rating-container">
                 <span className="rating-badge">
                   <Star size={15} fill="#ffb400" color="#ffb400" /> {flight.rating}
                 </span>
                 <span className="review-count">({flight.reviews?.toLocaleString()} reviews)</span> 
              </div>
            </div>
          </div>
        </div>

        <div className="card-column">
          <span className="mobile-label">Departure</span>
          <div className="flight-time">
            <div className="time-large">{flight.departure.code}</div>
            <div className="city-info">{flight.departure.city}</div>
          </div>
        </div>

        <div className="card-column plane-icon-col">
          <Plane className="plane-divider-icon" size={26} />
        </div>

        <div className="card-column">
          <span className="mobile-label">Arrive</span>
          <div className="flight-time">
            <div className="time-large">{flight.arrival.code}</div>
            <div className="city-info">{flight.arrival.city}</div>
          </div>
        </div>

        <div className="card-column status-badge-col">
            <div className="status-badge-green">
                <strong>{flight.status || 'Arrived'}</strong>
                <span>{flight.statusSubtext || 'On time'}</span>
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flight-card-footer"> 
        <button 
          className="flight-details-toggle-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
         Full Flight Details {showDetails ? '▲' : '▼'}
        </button>
        <div className="price-section">
            <span className="price-text">₹ {flight.price?.toLocaleString()}</span>
            <button className="book-btn">BOOK NOW</button>
        </div>
      </div>

      {/* The Detailed Tracker Panel (Matches image_8393ad.png) */}
      {showDetails && (
        <div className="tracker-details-panel">
          <div className="tracker-grid">
            
            {/* Departure Side */}
            <div className="tracker-box">
              <div className="airport-header">
                {flight.departure.city}, IN <br/>
                <small>{flight.departure.location}</small>
              </div>
              <div className="section-title">Flight Departure Times</div>
              <div className="date-label">{formattedDate}</div>
              
              <div className="time-comparison">
                <div className="time-type">
                   <span className="label">Scheduled</span>
                   <span className="value">{flight.departure.time} <span>IST</span></span>
                </div>
                <div className="time-type">
                   <span className="label">Actual</span>
                   <span className="value bold">{flight.departure.actualTime || flight.departure.time} <span>IST</span></span>
                </div>
              </div>

              <div className="info-footer">
                <div className="info-item">
                    <span className="label">Terminal</span>
                    <span className="value">{flight.departure.terminal || 'N/A'}</span>
                </div>
                <div className="info-item">
                    <span className="label">Gate</span>
                    <span className="value">{flight.departure.gate || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Arrival Side */}
            <div className="tracker-box">
              <div className="airport-header">
                {flight.arrival.city}, IN <br/>
                <small>{flight.arrival.location}</small>
              </div>
              <div className="section-title">Flight Arrival Times</div>
              <div className="date-label">{formattedDate}</div>
              
              <div className="time-comparison">
                <div className="time-type">
                   <span className="label">Scheduled</span>
                   <span className="value">{flight.arrival.time} <span>IST</span></span>
                </div>
                <div className="time-type">
                   <span className="label">Actual</span>
                   <span className="value bold">{flight.arrival.actualTime || flight.arrival.time} <span>IST</span></span>
                </div>
              </div>

              <div className="info-footer">
                <div className="info-item">
                    <span className="label">Terminal</span>
                    <span className="value">{flight.arrival.terminal || 'N/A'}</span>
                </div>
                <div className="info-item">
                    <span className="label">Gate</span>
                    <span className="value">{flight.arrival.gate || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default FlightCard; 