// --- UPDATED: FlightForesight.jsx ---
import './FlightForesight.css';

const FlightForesight = () => {
  // 1. ADD YOUR UNIQUE IMAGE PATHS HERE
  // Make sure these files exist in your public folder!
  const images = [
    '/flight-bg20.jpg',
    '/flight-bg21.jpg',
    '/flight-bg22.jpg',
    '/flight-bg23.jpg',
    '/flight-bg25.jpg',
    '/flight-bg24.jpg',
    '/flight-bg26.jpg',
    '/flight-bg33.jpg',
    '/flight-bg27.jpg',
    '/flight-bg32.jpg',
  ];

  return (
    <div className="foresight-container">
      <div className="foresight-content">
        <h2>Watch the world take flight.</h2>
        <p>
          Explore dynamic photos of aircraft taken and shared by the Flight Tracker community.
        </p>
      </div>

      <div className="sliding-view-wrapper">
        <div className="sliding-view-container">
          {images.map((src, index) => (
            <div key={index} className="foresight-image-card">
              {/* Images load directly from the public folder */}
              <img src={src} alt={`Aircraft ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>
      
      <div className="foresight-links-section">
        <h3>Learn More</h3>
        <div className="foresight-links">
          {/* <a href="" target="_blank" rel="noopener noreferrer">About</a>
          <a href="" target="_blank" rel="noopener noreferrer">Commercial Data</a> */}
        </div>
      </div>
    </div>
  );
};

export default FlightForesight;