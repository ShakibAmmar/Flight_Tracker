import  { useState } from 'react';
import Header from '../components/Header/Header';
// import ServiceTabs from '../components/ServiceTabs/ServiceTabs';
import FlightStatusCard from '../components/FlightStatusCard/FlightStatusCard';
import HotDeals from '../components/HotDeals/HotDeals';
import Footer from '../components/Footer/Footer';
import FlightForesight from '../components/FlightForesight/FlightForesight';
function HomePage({ onSearch }) {
  const [prefilledData, setPrefilledData] = useState(null);

  // This function receives the object from HotDeals.jsx
  // It contains: { airline, flightNumber, origin, destination, date, searchType }
  const handleFlightSelect = (flightData) => {
    setPrefilledData(flightData);
  };
  
  return (
    <>
      <Header />
      <main className="main-section">  
          <div className="hero-text-container">
          <div className='flight-title '>
           <span className="line-1">Live status Live routes Live sky</span>
  <span className="line-2">Travel smarter with real-time insight.</span>
          </div>
        </div>
        <div className="container">
          <FlightStatusCard onSearch={onSearch} prefilledData={prefilledData} />
        </div>   
      </main>
      <HotDeals onFlightSelect={handleFlightSelect} />
      {/* 3. --- ADDED: Place FlightForesight here --- */}
      <FlightForesight />
      <Footer />
    </>
  );
}

export default HomePage;