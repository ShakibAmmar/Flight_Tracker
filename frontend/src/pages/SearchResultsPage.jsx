import { useState, useEffect, useCallback } from 'react';
import './SearchResultsPage.css';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar/SearchBar';
// import FilterSidebar from '../components/FilterSidebar/FilterSidebar';
// import SortOptions from '../components/SortOptions/SortOptions';
import FlightCard from '../components/FlightCard/FlightCard';
import Footer from '../components/Footer/Footer';
import MapComponent from '../components/MapComponent/MapComponent';
import { AlertCircle, RefreshCw } from 'lucide-react';

const FlightSkeleton = () => ( 
  <div className="flight-skeleton-row">
    <div className="skeleton-item shimmer" style={{ width: '150px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '100px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '80px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '100px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '120px' }}></div>
  </div>
);

function SearchResultsPage({ searchData: initialSearchData, onBack,setIsLoginOpen, }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [flights, setFlights] = useState([]);
  const [currentSearchData, setCurrentSearchData] = useState(initialSearchData);
const fetchFlights = useCallback(async (searchData) => {
  setIsLoading(true);
  setHasError(false);

  try {
    const flightNoInput = searchData.flightNumber.toUpperCase();

    // 1. Call your Express backend scraper endpoint
    const response = await fetch(`http://localhost:5000/api/flight-tracker/${flightNoInput}`);
    
    if (!response.ok) throw new Error("Server responded with an error");
    
    const scrapedData = await response.json();

    if (scrapedData && !scrapedData.error) {
      // 2. Map the Scraper Data to your UI Object Structure
      // This ensures your <FlightCard /> and <MapComponent /> work without changes
      const liveFlight = {
        id: Date.now(), // Generate a unique ID for React keys
        airline: scrapedData.airline.replace(/\d+/g, '').trim().toLowerCase(),
        flightNumber: flightNoInput,
        logo: `https://www.google.com/s2/favicons?domain=flightaware.com&sz=64`,
        status: scrapedData.status,
        statusSubtext: scrapedData.status.includes("Arrived") ? "Completed" : "Live Updates",
        departure: { 
          actual: scrapedData.departure.actual,
          date: scrapedData.departure.date,
          time: scrapedData.departure.time, 
          city: scrapedData.departure.city, 
          code: scrapedData.departure.cityCode, 
          location: scrapedData.departure.airport, 
          terminal: "N/A", 
          gateTerminal: scrapedData.departure.gateTerminal,
          gate:scrapedData.departure.gate

        },
        arrival: { 
          date: scrapedData.arrival.date,
          time: scrapedData.arrival.time, 
          city: scrapedData.arrival.city, 
          code: scrapedData.arrival.cityCode, 
          location: scrapedData.arrival.airport, 
          terminal: scrapedData.arrival.terminal, 
          gate: scrapedData.arrival.gate 
        },
        type: scrapedData.duration || "Boeing/Airbus", // Using duration as a placeholder or meta info
        price: null // Scraped data doesn't usually include price
      };

      setFlights([liveFlight]);
    } else {
      // If no data found by scraper, set empty list
      setFlights([]);
    }
  } catch (err) {
    console.error("Scraper Fetch Error:", err);
    setHasError(true);
  } finally {
    setIsLoading(false);
  }
}, []);
  const handleNewSearch = (newCriteria) => {
    setCurrentSearchData(newCriteria);
    fetchFlights(newCriteria);
  };

  useEffect(() => {
    fetchFlights(currentSearchData);
  }, [fetchFlights, currentSearchData]);

  // Logic to filter flights based on the search type (Flight Number or Route)
  const filteredFlights = flights.filter(flight => {
    if (currentSearchData.searchType === 'flight') {
      // If user provided a flight number, filter strictly by it
      if (currentSearchData.flightNumber) {
        return flight.flightNumber.toLowerCase().includes(currentSearchData.flightNumber.toLowerCase());
      }
    } else if (currentSearchData.searchType === 'route') {
      // Filter by From and To cities
      const matchesFrom = !currentSearchData.fromCity || flight.departure.city.toLowerCase().includes(currentSearchData.fromCity.toLowerCase());
      const matchesTo = !currentSearchData.toCity || flight.arrival.city.toLowerCase().includes(currentSearchData.toCity.toLowerCase());
      return matchesFrom && matchesTo;
    }
    return true; // Show all if no criteria
  });

  return (
    <div className="search-results-page">
      <Header onHomeClick={onBack} />
      
      <SearchBar 
        searchData={currentSearchData} 
        onSearch={handleNewSearch} 
        onBack={onBack} 
      />
      
      <div className="results-container">
        <div className="results-main">
          {/* <div className="toolbar-row">
            <FilterSidebar />
            <SortOptions />
          </div>  */}
          
          {isLoading && ( 
            <div className="loading-progress-container">
              <div className="loading-progress-bar"></div>
            </div> 
          )}

          {hasError ? (
            <div className="error-state-container">
              <AlertCircle size={48} color="#ef4444" />
              <h2>Something went wrong</h2>
              <p>We couldn't fetch the latest flight data. Please check your connection.</p>
              <button className="retry-btn" onClick={() => fetchFlights(currentSearchData)}>
                <RefreshCw size={18} /> Try Again
              </button>
            </div>
          ) : (
            <>
             {/* <div className="results-header">
                <div className="results-col">AIRLINES</div>
                <div className="results-col">DATE</div>
                <div className="results-col">DEPARTURE</div>
                <div className="results-col">DURATION</div>
                <div className="results-col">ARRIVE</div>
                <div className="results-col">PRICE</div>
              </div> */}

              <div className="flight-list">
                {isLoading ? (
                  [...Array(6)].map((_, i) => <FlightSkeleton key={i} />)
                ) : filteredFlights.length > 0 ? (
                  filteredFlights.map(flight => ( 
                    <div key={flight.id} className="flight-card-animated">
                      <FlightCard flight={flight} setIsLoginOpen={setIsLoginOpen}
                      searchDate={currentSearchData.selectedDate} // Pass the calendar date here
                      />
                    </div>
                  ))
                ) : (
                  <div className="no-results-container">
                    <div className="no-results-icon">🚫</div>
                    <h2>No Flights Found </h2>
                    <p>We couldn't find any flights for "{currentSearchData.flightNumber || currentSearchData.fromCity}" on this date.</p>
                    <button className="back-search-btn" onClick={onBack}>
                      Modify Search
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className= "title" > 
        <h1> Live flight LOCATION</h1>
         </div>

    {!isLoading && filteredFlights.length > 0 && (
        <MapComponent selectedFlight={filteredFlights[0]} />
    )}
      </div>
      <Footer />
    </div>
  );
}

export default SearchResultsPage;