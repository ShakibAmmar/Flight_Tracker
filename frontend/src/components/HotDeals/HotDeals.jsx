import './HotDeals.css';
import { ChevronLeft, ChevronRight, ArrowRight, Star } from 'lucide-react';
import { useRef } from 'react';

function HotDeals({ onFlightSelect }) {
  const scrollRef = useRef(null);

  // 1. ADDED: origin, destination, and date to the data
  const popularFlights = [
    {
      id: 1,
      airline: 'Air India',
      flightNumber: 'AI101',
      rating: 8.5,
      reviews: 12453,
      image: '/flight-bg23.jpg',
      route: 'Delhi → New York',
      origin: 'Delhi',      // Added
      destination: 'New York', // Added
      date: new Date().toISOString().split('T')[0] // Sets it to Today's date
    },
    {
      id: 2,
      airline: 'American Airlines',
      flightNumber: 'AA100',
      rating: 8.2,
      reviews: 8932,
      image: '/flight-bg21.jpg',
      route: 'NEW YORK → London',
      origin: 'New York',
      destination:'London',
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: 3,
      airline: 'Emirates',
      flightNumber: 'EK231',
      rating: 8.9,
      reviews: 5621,
      image: '/flight-bg24.jpg',
      route: 'Dubai → Washington',
      origin: 'Dubai',
      destination: 'Washington',
      date: new Date().toISOString().split('T')[0]
    },
     {
      id: 4,
      airline: 'Qatar Airways',
      flightNumber: 'QR571',
      rating: 8.9,
      reviews: 5621,
      image: '/flight-bg22.jpg',
      route: 'Delhi → Doha',
      origin: 'Delhi',
      destination: 'Doha',
      date: new Date().toISOString().split('T')[0]
    },
     {
      id: 5,
      airline: 'Spice Jet',
      flightNumber: 'SG-123',
      rating: 8.9,
      reviews: 5621,
      image: '/flight-bg23.jpg',
      route: 'Bangalore → Chennai',
      origin: 'Bangalore',
      destination: 'Chennai',
      date: new Date().toISOString().split('T')[0]
    },
     {
      id: 6,
      airline: 'Akasa Air',
      flightNumber: 'QP-1305',
      rating: 8.9,
      reviews: 5621,
      image: '/flight-bg24.jpg',
      route: 'Mumbai → Bangalore',
      origin: 'BOM',
      destination: 'BLR',
      date: new Date().toISOString().split('T')[0]
    },
     {
      id: 7,
      airline: 'Akasa Air',
      flightNumber: 'QP-1305',
      rating: 8.9,
      reviews: 5621,
      image: '/flight-bg21.jpg',
      route: 'Mumbai → Bangalore',
      origin: 'BOM',
      destination: 'BLR',
      date: new Date().toISOString().split('T')[0]
    },
    // ... Repeat the origin/destination pattern for your other flights
  ];

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = 300; 
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleFlightClick = (flight) => {
    if (onFlightSelect) {
      // 2. UPDATED: Passing all fields back
      onFlightSelect({
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        origin: flight.origin,
        destination: flight.destination,
        date: flight.date,
        searchType: 'flight' // You can still keep this to trigger the UI switch
      });

      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Focus the input after a small delay
      setTimeout(() => {
        const input = document.querySelector('input[placeholder*="Flight Number"]');
        if (input) input.focus();
      }, 800);
    }
  };

  return (
    <div className="hot-deals-section">
      <div className="hot-deals-container">
        <div className="hot-deals-header">
          <h2>Popular Flights to Track</h2>
        </div>

        <div className="deals-navigation-wrapper">
          <button className="nav-arrow left" onClick={() => scroll('left')} aria-label="Scroll left">
            <ChevronLeft size={24} />
          </button>
          
          <button className="nav-arrow right" onClick={() => scroll('right')} aria-label="Scroll right">
            <ChevronRight size={24} />
          </button>

          <div className="deals-grid" ref={scrollRef}>
            {popularFlights.map(flight => (
              <div 
                key={flight.id} 
                className="deal-card"
                onClick={() => handleFlightClick(flight)}
              >
                <div className="deal-image">
                  <img src={flight.image} alt={flight.airline} />
                  <div className="trending-badge">Trending</div>
                </div>

                <div className="deal-content">
                  <h3 className="airline-name">{flight.airline}</h3>
                  <p className="flight-number">{flight.flightNumber}</p>
                  <p className="flight-route">{flight.route}</p>

                  <div className="deal-rating">
                    <span className="rating-score">
                      <Star size={14} fill="#fbbf24" color="#fbbf24" />
                      {flight.rating}
                    </span>
                    <span className="rating-reviews">({flight.reviews.toLocaleString()} reviews)</span>
                  </div>

                  <button 
                    className="track-flight-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlightClick(flight);
                    }}
                  >
                    Track <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotDeals;