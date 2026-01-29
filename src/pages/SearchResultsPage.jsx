import { useState, useEffect, useCallback } from 'react';
import './SearchResultsPage.css';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar/SearchBar';
import FilterSidebar from '../components/FilterSidebar/FilterSidebar';
import SortOptions from '../components/SortOptions/SortOptions';
import FlightCard from '../components/FlightCard/FlightCard';
import Footer from '../components/Footer/Footer';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Optimized Skeleton Component
const FlightSkeleton = () => ( 
  <div className="flight-skeleton-row">
    <div className="skeleton-item shimmer" style={{ width: '150px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '100px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '80px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '100px' }}></div>
    <div className="skeleton-item shimmer" style={{ width: '120px' }}></div>
  </div>
);

function SearchResultsPage({ searchData: initialSearchData, onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [flights, setFlights] = useState([]);
  const [currentSearchData, setCurrentSearchData] = useState(initialSearchData);

  const fetchFlights = useCallback((searchParams) => {
    setIsLoading(true);
    setHasError(false);

    setTimeout(() => {
      const isSuccessful = navigator.onLine; 

      if (isSuccessful) {
      const mockData = [
  { 
    id: 1, 
    airline: 'Air India Express', 
    flightNumber: 'IX-124', 
    logo: '✈️', 
    status: 'Arrived',
    statusSubtext: 'On time',
    rating: 4.2, 
    reviews: 1250, 
    departure: { 
      time: '15:00', 
      actualTime: '14:55', 
      city: 'London', 
      code: 'LHR',
      location: 'London Heathrow Airport, UK',
      terminal: '4',
      gate: 'B32'
    }, 
    arrival: { 
      time: '17:00', 
      actualTime: '16:50', 
      city: 'Mumbai',
      code: 'BOM',
      location: 'Chhatrapati Shivaji Maharaj Intl',
      terminal: 'T2',
      gate: 'A1'
    }, 
    duration: '02h 00m', 
    type: 'Nonstop', 
    price: 5260, 
    offer: 'Save ₹500' 
  },
  { 
    id: 2, 
    airline: 'IndiGo', 
    flightNumber: '6E-245', 
    logo: '✈️', 
    status: 'Arrived',
    statusSubtext: 'On time',
    rating: 4.5, 
    reviews: 8420, 
    departure: { 
      time: '06:20', 
      actualTime: '06:11', 
      city: 'Kolkata', 
      code: 'CCU',
      location: 'Netaji Subhash Chandra Bose Intl',
      terminal: '1',
      gate: '14'
    }, 
    arrival: { 
      time: '09:15', 
      actualTime: '09:07', 
      city: 'Ahmedabad', 
      code: 'AMD',
      location: 'Sardar Vallabhbhai Patel Intl',
      terminal: '2',
      gate: 'G5'
    }, 
    duration: '02h 15m', 
    type: 'Nonstop', 
    price: 5261, 
    offer: '',
    date: '27-Jan-2026'
  },
  { 
    id: 3, 
    airline: 'Air India', 
    flightNumber: 'AI-860', 
    logo: '✈️', 
    status: 'Arrived',
    statusSubtext: 'On time',
    rating: 3.8, 
    reviews: 3100, 
    departure: { 
      time: '09:15', 
      actualTime: '09:15',
      city: 'Delhi', 
      code: 'DEL',
      location: 'Indira Gandhi International',
      terminal: 'T3',
      gate: '22'
    }, 
    arrival: { 
      time: '11:30', 
      actualTime: '11:30',
      city: 'Mumbai',
      code: 'BOM',
      location: 'Chhatrapati Shivaji Maharaj Intl',
      terminal: 'T2',
      gate: 'N/A'
    }, 
    duration: '02h 15m', 
    type: 'Nonstop', 
    price: 4588, 
    offer: '' 
  },
  { 
    id: 4, 
    airline: 'Vistara', 
    flightNumber: 'UK-995', 
    logo: '✈️', 
    status: 'Scheduled',
    statusSubtext: 'Expected 12:10',
    rating: 4.8, 
    reviews: 5200, 
    departure: { 
      time: '12:00', 
      actualTime: '12:10',
      city: 'Delhi', 
      code: 'DEL',
      location: 'Indira Gandhi International',
      terminal: 'T3',
      gate: '41'
    }, 
    arrival: { 
      time: '14:20', 
      actualTime: '14:35',
      city: 'Mumbai',
      code: 'BOM',
      location: 'Chhatrapati Shivaji Maharaj Intl',
      terminal: 'T2',
      gate: 'B12'
    }, 
    duration: '02h 20m', 
    type: 'Nonstop', 
    price: 5711, 
    offer: 'Club Vistara Bonus' 
  },
  { 
    id: 5, 
    airline: 'SpiceJet', 
    flightNumber: 'SG-123', 
    logo: '✈️', 
    status: 'Delayed',
    statusSubtext: '+45 mins',
    rating: 3.5, 
    reviews: 2100, 
    departure: { 
      time: '18:45', 
      actualTime: '19:30',
      city: 'Bangalore', 
      code: 'BLR',
      location: 'Kempegowda International',
      terminal: 'T1',
      gate: 'C5'
    }, 
    arrival: { 
      time: '21:00', 
      actualTime: '21:40',
      city: 'Chennai',
      code: 'MAA',
      location: 'Chennai International Airport',
      terminal: 'Domestic',
      gate: 'G2'
    }, 
    duration: '02h 15m', 
    type: 'Nonstop', 
    price: 3899, 
    offer: 'Student Discount' 
  },
  { 
    id: 6, 
    airline: 'Air India Express', 
    flightNumber: 'IX-122', 
    logo: '✈️', 
    status: 'Arrived',
    statusSubtext: 'On time',
    rating: 4.2, 
    reviews: 1250, 
    departure: { 
      time: '15:00', 
      actualTime: '15:00',
      city: 'London', 
      code: 'LHR',
      location: 'Heathrow Airport, London',
      terminal: '2',
      gate: 'A18'
    }, 
    arrival: { 
      time: '17:00', 
      actualTime: '17:00',
      city: 'Mumbai',
      code: 'BOM',
      location: 'Chhatrapati Shivaji Maharaj Intl',
      terminal: 'T2',
      gate: 'N/A'
    }, 
    duration: '02h 00m', 
    type: 'Nonstop', 
    price: 5260, 
    offer: '' 
  }
];

        setFlights(mockData);
        setIsLoading(false);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    }, 2000);
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
          <div className="toolbar-row">
            <FilterSidebar />
            <SortOptions />
          </div> 
          
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
                      <FlightCard flight={flight}
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
      </div>
      <Footer />
    </div>
  );
}

export default SearchResultsPage;