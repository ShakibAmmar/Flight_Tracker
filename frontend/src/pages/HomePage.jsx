import  { useState } from 'react';
import Header from '../components/Header/Header';
import ServiceTabs from '../components/ServiceTabs/ServiceTabs';
import FlightStatusCard from '../components/FlightStatusCard/FlightStatusCard';
import HotDeals from '../components/HotDeals/HotDeals';
import Footer from '../components/Footer/Footer';

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
        <div 
        className="main-section-bg" 
        // style={{ backgroundImage: `url('/flight-bg28.jpg` }}
      ></div>
   <div className="hero-text-container">
          <div className='flight-title shimmer-title'>
          Check Live Flight Status
          </div>
          {/* <h1 className="hero-subtitle">A Great Experience</h1> */}
        </div>
        <div className="container">
          <ServiceTabs />
          {/* prefilledData is passed here to update the inputs in FlightStatusCard */}
          <FlightStatusCard onSearch={onSearch} prefilledData={prefilledData} />
        </div>
     
        
       <div className="hero-image-container">
          <div className="pill-mask">
            <img 
              src="/flight-bg22.jpg" 
              alt="Airplane in sky" 
              className="hero-airplane"
            />
          </div>
        </div> 
      </main>
      
      {/* Hot Deals Section triggers the update */}
      <HotDeals onFlightSelect={handleFlightSelect} />
      
      <Footer />
    </>
  );
}

export default HomePage;