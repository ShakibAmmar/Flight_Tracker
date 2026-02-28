import { useState, useRef ,useEffect } from 'react';
import { Star, Plane, User, Clock, Loader2, RefreshCw, MapPin, Armchair, Users, Calendar } from 'lucide-react'; 
import './FlightCard.css'; 
import { auth } from "../firebase/firebase";  
function FlightCard({ flight, searchDate ,setIsLoginOpen = () => {},}) { 
  const [showDetails, setShowDetails] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsData, setReviewsData] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 
  const reviewsTopRef = useRef(null); 
  const [showWriteForm, setShowWriteForm] = useState(false); 
  const [showSuccessToast, setShowSuccessToast] = useState(false); 
  // Inside your FlightCard component function
const getStatusClass = (status) => {
    if (status === 'LANDED') return 'status-badge-blue';
    if (status === 'CANCELLED') return 'status-badge-red';
    return 'status-badge-green';
}; 

const handleReviewToggle = () => {
    //  Check if a user is currently signed in via Firebase 
    const currentUser = auth.currentUser;
    // Also check your local storage token as a backup
    const token = localStorage.getItem('token');
    
    // If neither exists, show the popup and open login modal
    if (!currentUser && !token) {
      alert("Please login first to write a review!");
      if (typeof setIsLoginOpen === 'function') {
        setIsLoginOpen(true);
      }
      return; 
    } 
    // If logged in, proceed with your existing toggle logic
    if (typeof toggleSection === 'function') {
      toggleSection('reviews');
    }
  };
const getDistribution = (label) => {

  if (!reviewsData || reviewsData.length === 0) return 0;
  
  //  Mapping labels to rating ranges (1-10 scale)
  const map = { 
    "Excellent": [9, 10], 
    "Good": [7, 8], 
    "Average": [5, 6], 
    "Poor": [3, 4], 
    "Terrible": [0, 2] 
  };
  
  const range = map[label];
  
  const count = reviewsData.filter(rev => {
    //  Handle potential missing rating fields in the database
    const r = parseFloat(rev.rating);
    return !isNaN(r) && r >= range[0] && r <= range[1];
  }).length; 

  // 4. Return percentage
  return (count / reviewsData.length) * 100;
};
const [formData, setFormData] = useState({
  airline: flight.airline.toLowerCase().trim().replace(/\s+/g, '-'), // Auto-filled "air-canada"
  user: "",
  rating: "5",
  review: "",
  traveller: "Solo Leisure",
  seatType: "Economy Class",
  route: "",
  dateFlown: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), // e.g. "February 2026"
  seatComfort: "3",
  cabinService: "3",
  aircraftNumber:'',
  groundService: "3",
  valueMoney: "3",
  date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) // e.g. "11th February 2026"
});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
useEffect(() => {
  const list = document.querySelector('.reviews-list');
  if (list) { 
    list.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const panel = document.querySelector('.review-details-panel');
  if (panel && showReviews) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, [currentPage, showReviews]); // Added showReviews here

  const ReviewSkeleton = () => (
    <div className="individual-review skeleton">
      <div className="review-user">
        <div className="user-avatar skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton-box" style={{ width: '30%', height: '14px', marginBottom: '8px' }}></div>
          <div className="skeleton-box" style={{ width: '20%', height: '10px' }}></div>
        </div>
        <div className="skeleton-box" style={{ width: '40px', height: '20px' }}></div>
      </div>
      <div className="skeleton-box" style={{ width: '100%', height: '12px', marginTop: '15px' }}></div>
      <div className="skeleton-box" style={{ width: '90%', height: '12px', marginTop: '8px' }}></div>
    </div>
  ); 
  
  // const formattedDate = searchDate instanceof Date 
  //   ? searchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  //   : searchDate;

  const calculateAverageRating = () => {
    if (!reviewsData || reviewsData.length === 0) return flight.rating;
    const validRatings = reviewsData.map(rev => parseFloat(rev.rating)).filter(num => !isNaN(num));
    if (validRatings.length === 0) return flight.rating; 
    const sum = validRatings.reduce((a, b) => a + b, 0); 
    return (sum / validRatings.length).toFixed(1); 
  };
  const renderStars = (rating) => {
  const score = parseFloat(rating) || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= score ? "star filled" : "star"}>
        ★
      </span>
    );
  }
  return stars;
};

  const averageRating = calculateAverageRating(); 

  const fetchLiveReviews = async (retryCount = 0, forceRefresh = false) => {
    if (retryCount > 5) { 
      setIsLoading(false); 
      return;
    } 
    setIsLoading(true); 
    try { 
      const airlineSlug = flight.airline.toLowerCase().trim().replace(/\s+/g, '-');
      const url = `http://localhost:5000/api/reviews/${airlineSlug}${forceRefresh ? '?refresh=true' : ''}`;
      const response = await fetch(url);
      if (response.status === 202) {
        setTimeout(() => fetchLiveReviews(retryCount + 1, forceRefresh), 4000);
        return;
      }
      if (response.status === 429) {
        alert("Servers busy. Try again in 30 seconds.");
        setIsLoading(false);
        return;
      }
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
     const data = await response.json();
      
      //  SORTING LOGIC 
      const sortedData = [...data].sort((a, b) => {
        
        const dateA = new Date(a.date.replace(/(\d+)(st|nd|rd|th)/, "$1"));
        const dateB = new Date(b.date.replace(/(\d+)(st|nd|rd|th)/, "$1"));
        
        if (dateB - dateA !== 0) {
          return dateB - dateA; 
        }

        
        return new Date(b.scrapedAt) - new Date(a.scrapedAt);
      });
      
      setReviewsData(sortedData);
      setCurrentPage(1); // Reset to first page on new fetch
      setShowReviews(true);
      setShowDetails(false);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false); 
    } 
  }; 
  const toggleSection = (section) => {
    if (section === 'details') {
      setShowDetails(!showDetails);
      setShowReviews(false);
    } else {
      if (showReviews) setShowReviews(false);
      else fetchLiveReviews(0, false); 
    }
  }; 

  // Pagination Logic
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviewsData.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviewsData.length / reviewsPerPage);
 const handleSubmitReview = async (e) => {
    e.preventDefault(); 
    
    try {
        const response = await fetch('http://localhost:5000/api/reviews/submit', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData), 
        }); 

        if (response.ok) {
            console.log("Success! Triggering Toast...");
            setShowWriteForm(false);    
            setShowSuccessToast(true);  
            
            // Auto-hide toast after 3 seconds
            setTimeout(() => {
                setShowSuccessToast(false);
                console.log("Hide Toast");
            }, 4000);

            await fetchLiveReviews(0, true); 
        }
    } catch (err) {
        console.error("Button failed because of:", err);
    }
};
   
  return (
    <div className="flight-card">
      <div className="flight-main">  
        <div className="card-column">
          <span className="mobile-label">Airlines</span>
          <div className="flight-airline"> 
            <div className="airline-logo-text">{flight.logo}</div>
            <div className="airline-info">
              <div className="airline-name">{flight.airline}</div>
              <div className="flight-number">{flight.flightNumber}</div>
            </div>
          </div>
        </div>
        <div className="card-column">
          <span className="mobile-label">Departure</span>
          <div className="flight-time">
            <div className="time-large">{flight.departure.code || 'LHR'}</div>
            <div className="city-info">{flight.departure.city}</div>
          </div>
        </div>
        <div className="card-column plane-icon-col">
          <Plane className="plane-divider-icon" size={26} />
        </div>
        <div className="card-column">
          <span className="mobile-label">Arrive</span>
          <div className="flight-time">
            <div className="time-large">{flight.arrival.code || 'BOM'}</div>
            <div className="city-info">{flight.arrival.city}</div>
          </div>
        </div>
        <div className="card-column status-badge-col">
            <div className={getStatusClass(flight.status)}>
    <strong>{flight.status}</strong>
    <span>{flight.statusSubtext}</span>
</div>
        </div>
      </div>

      <div className="flight-card-footer"> 
        <div className="toggle-buttons-group">
            <button className={`toggle-btn ${showDetails ? 'active' : ''}`} onClick={() => toggleSection('details')}>
              Flight Details {showDetails ? '▲' : '▼'}
            </button>
            <button 
  className={`toggle-btn ${showReviews ? 'active' : ''} ${isLoading ? 'loading' : ''}`} 
  onClick={handleReviewToggle} 
  disabled={isLoading}
>
  {isLoading ? (
    <><Loader2 className="spinner-icon" size={16} /> Searching...</>
  ) : (
    `User Reviews ${showReviews ? '▲' : '▼'}`
  )}
</button>
        </div>
        <div className="price-section">
            <span className="price-text">₹ {flight.price?.toLocaleString()}</span>
            <button className="book-btn">BOOK NOW</button>
        </div>
      </div>

      {showDetails && (
  <div className="tracker-details-panel">
    <div className="details-sub-header">
       <span>{flight.type}</span> — <span>{flight.duration}</span>
    </div>
    <div className="tracker-grid">
     
      <div className="tracker-box">
        <div className="airport-header">
          {flight.departure.city} <br/>
          <small>Departure Airport : {flight.departure.location}</small>
        </div>
        <div className="section-title">Flight Departure Times</div>
        <div className="date-label">{flight.departure.date}</div>
        <div className="time-comparison">
          <div className="time-type">
            <span className="label">Scheduled</span>
            <span className="value">{flight.departure.time}</span>
          </div>
          {/* <div className="time-type">
            <span className="label">Actual</span>
            <span className="value bold">{flight.departure.actual}</span>
          </div> */}
        </div>
      
        <div className="info-footer">
          <div className="info-item">
            <span className="label">Terminal</span>
            <span className="value">{flight.departure.gateTerminal|| 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Gate</span>
            <span className="value">{flight.departure.gate || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="tracker-box">

        <div className="airport-header">
          {flight.arrival.city}<br/>
          <small>Arrival Airport : {flight.arrival.location}</small>
        </div>
        <div className="section-title">Flight Arrival Times</div>
        <div className="date-label">{flight.arrival.date}</div>
        <div className="time-comparison">
          <div className="time-type">
            <span className="label">Scheduled</span>
            <span className="value">{flight.arrival.time}</span>
          </div>
          {/* <div className="time-type">
            <span className="label">Actual</span>
            <span className="value bold">{flight.arrival.actualTime || flight.arrival.time}</span>
          </div> */}
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
{showReviews && (
        <div className="review-details-panel">
          {/* This empty div acts as the scroll target */}
          <div ref={reviewsTopRef} />
          <div className="review-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            {/* IMPROVED: Now shows the actual Review Date of the latest entry */}
            {reviewsData.length > 0 ? (
              <div className="review-timestamp-label">
                <Clock size={12} /> 
                <small> 
                  Latest Review: <strong>{reviewsData[0].date}</strong>
                </small>
              </div>
            ) : <div></div>}
            <button className="refresh-sync-btn" onClick={() => fetchLiveReviews(0, true)} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              {isLoading ? 'Updating...' : 'Refresh Live'}
            </button>
          </div>

          <div className="review-summary-header">
             <div className="rating-big-score">
                <h1>{averageRating} </h1>
                <div>
                    <div className="stars-row">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={18} fill={s <= Math.floor(averageRating)  ? "#ffb400" : "none"} color="#ffb400" />
                        ))}
                    </div>
                    <p>{reviewsData.length > 0 ? reviewsData.length : flight.reviews} Latest verified reviews</p>
                </div>
                
          <div className="stats-and-button-wrapper">

          <div className="rating-distribution-graph">
            {["Excellent", "Good", "Average", "Poor", "Terrible"].map((label) => (
              <div key={label} className="dist-row">
                <span className="dist-label">{label}</span>
                <div className="dist-bar-bg">
                  <div 
                    className="dist-bar-fill" 
                    style={{ width: `${getDistribution(label)}%` }}
                  ></div>
                </div>
                <span className="dist-count">
                  {reviewsData.filter(rev => {
                    const map = { "Excellent": [9,10], "Good": [7,8], "Average": [5,6], "Poor": [3,4], "Terrible": [0,2] };
                    return parseFloat(rev.rating) >= map[label][0] && parseFloat(rev.rating) <= map[label][1];
                  }).length}
                </span>
              </div>
            ))}
          </div>

            <div>
        <button 
  className="write-review-toggle-btn" 
  onClick={() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Show the popup first so it doesn't feel frozen
      alert("Please login first to write a review!");
      
      // Then try to open the login modal automatically
      if (typeof setIsLoginOpen === 'function') {
        setIsLoginOpen(true);
      }
      return;
    }
    
    // If login is successful, toggle the form
    setShowWriteForm(!showWriteForm);
  }}
>
  {showWriteForm ? "Cancel" : "Write a Review"}
</button>
          </div>
        </div>
               </div>
          </div>

          <div className="reviews-list">
            {isLoading ? (
              [1, 2, 3].map(i => <ReviewSkeleton key={i} />)
            ) : currentReviews.length > 0 ? (
              <>
                {currentReviews.map((rev) => (
                  <div key={rev._id} className="individual-review">
                    <div className="review-user">
                        <div className="user-avatar"><User size={20} /></div>
                        <div style={{ flex: 1 }}>
                          <div className="user-name">{rev.user}</div>
                          <div className="review-date">{rev.date}</div>
                        </div>
                        <div className="user-rating-wrapper" style={{ textAlign: 'right' }}>
                          <div className={`sentiment-tag ${parseFloat(rev.rating) >= 7 ? 'pos' : parseFloat(rev.rating) >= 4 ? 'neu' : 'neg'}`}>
                            {parseFloat(rev.rating) >= 7 ? 'Positive' : parseFloat(rev.rating) >= 4 ? 'Neutral' : 'Critical'}
                          </div>
                          <div className="user-rating-score">
                            {rev.rating}/10 <Star size={12} fill="#ffb400" color="#ffb400" />
                          </div>
                        </div>
                    </div>

                    <div className="review-meta-grid">
                      <div className="meta-item"><MapPin size={16}/> <span>{rev.route || 'N/A'}</span></div>
                      <div className="meta-item"><Armchair size={16}/> <span>{rev.seatType || 'N/A'}</span></div>
                      <div className="meta-item"><Users size={16}/> <span>{rev.traveller || 'N/A'}</span></div>
                      <div className="meta-item"><Calendar size={16}/> <span>{rev.dateFlown || 'N/A'}</span></div>
                    </div>

                    <p className="review-text">{rev.review}</p>

                
                    <div className="review-rating-pills">
                      <div className="rating-pill">
                        Aircraft :<span className="star-rating">{rev.aircraftNumber}</span>
                      </div>
                         <div className="rating-pill">
                            Seat Comfort : <span className="star-rating">{renderStars(rev.seatComfort)}</span>
                         </div>
                          <div className="rating-pill">
                            Cabin Staff : <span className="star-rating">{renderStars(rev.cabinService)}</span>
                           </div>
                     <div className="rating-pill">
                           Ground Service : <span className="star-rating">{renderStars(rev.groundService)}</span>
                       </div>
                     <div className="rating-pill">
                        Value for Money : <span className="star-rating">{renderStars(rev.valueMoney)}</span>
                      </div>
                      </div>
                  </div>
                ))}

                {reviewsData.length > reviewsPerPage && (
          <div className="pagination-container">
            <div className="pagination-bar">
              <button 
                className="paging-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                &larr;
              </button>

              <div className="page-numbers">
              
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                className="paging-btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                &rarr;
              </button>
            </div>
            
            {currentPage === totalPages && (
              <div className="end-of-list-msg">
                <div className="line"></div>
                <span>You've reached the end of the reviews</span>
                <div className="line"></div>
              </div>
            )}
          </div>
        )}
              </>
            ) : (
              <p className="no-reviews">No live reviews found for this airline yet.</p>
            )}
          </div>
        </div>
      )}

{showWriteForm && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2>Submit Your Experience</h2>
        <button className="close-modal" onClick={() => setShowWriteForm(false)}>&times;</button>
      </div>
      
      <form className="write-review-form" onSubmit={handleSubmitReview}>
        <div className="form-grid">
          <div className="input-group">
            <label>Name</label>
            <input type="text" placeholder="e.g. Enter Name" value={formData.user} onChange={(e) => setFormData({...formData, user: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Route</label>
            <input type="text" placeholder="e.g. Cancun to Toronto" value={formData.route} onChange={(e) => setFormData({...formData, route: e.target.value})} required/>
          </div>
          <div className="input-group">
            <label>Traveller Type</label>
            <select value={formData.traveller} onChange={(e) => setFormData({...formData, traveller: e.target.value})}>
              <option value="Solo Leisure">Solo Leisure</option>
              <option value="Couple Leisure">Couple Leisure</option>
              <option value="Business">Business</option>
              <option value="Family Leisure">Family Leisure</option>
            </select>
          </div>
          <div className="input-group">
            <label>Seat Type</label>
            <select value={formData.seatType} onChange={(e) => setFormData({...formData, seatType: e.target.value})}>
              <option value="Economy Class">Economy Class</option>
              <option value="Premium Economy">Premium Economy</option>
              <option value="Business Class">Business Class</option>
              <option value="First Class">First Class</option>
            </select>
          </div>
        </div> 

        <div className="input-group">
          <label>Your Review</label>
          <textarea placeholder="Tell us about the service..." value={formData.review} onChange={(e) => setFormData({...formData, review: e.target.value})} required />
        </div>

        <div className="ratings-selectors">
          <div className="rating-input">Overall (1-10) <input type="number" min="1" max="10" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} /></div>
          <div className="rating-input">Seat (1-5) <input type="number" min="1" max="5" value={formData.seatComfort} onChange={(e) => setFormData({...formData, seatComfort: e.target.value})} /></div>
          <div className="rating-input">Service (1-5) <input type="number" min="1" max="5" value={formData.cabinService} onChange={(e) => setFormData({...formData, cabinService: e.target.value})} /></div>
          <div className="rating-input">Ground (1-5) <input type="number" min="1" max="5" value={formData.groundService} onChange={(e) => setFormData({...formData, groundService: e.target.value})} /></div>
          <div className="rating-input">Value (1-5)<input type="number" min="1" max="5" value={formData.valueMoney} onChange={(e) => setFormData({...formData, valueMoney: e.target.value})} /></div>
        </div>

        <button type="submit" className="submit-review-btn">Post Review to {flight.airline}</button>
      </form>
    </div>
  
  </div>
)}
    {showSuccessToast && (
      <div className="success-toast">
        <div className="toast-icon">✓</div>
        <div className="toast-message">Review saved successfully!</div>
      </div>
    )}
    </div>
  );
}

export default FlightCard; 
