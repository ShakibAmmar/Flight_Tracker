import  { useState, useRef, useEffect } from 'react';
import './SearchBar.css';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { airlines, cities } from '../../constants/data';

// Date formatter function
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    day: days[date.getDay()],
    date: `${date.getDate()} ${months[date.getMonth()]}'${String(date.getFullYear()).slice(2)}`
  };
};

function SearchBar({ searchData, onBack, onSearch }) { 
  const [searchType, setSearchType] = useState('flight');
  const [flightNumber, setFlightNumber] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [airline, setAirline] = useState(''); 
  
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));

  // NEW: Validation and Animation States
  const [errors, setErrors] = useState({});
  const [isShaking, setIsShaking] = useState(false);

  // Dropdown states
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // Refs for click outside
  const airlineRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const calendarRef = useRef(null);

  const dateInfo = formatDate(selectedDate);

  // Filter functions
  const filteredAirlines = airlines.filter(a => 
    a.toLowerCase().includes(airline.toLowerCase())
  );

  const filteredFromCities = cities.filter(c => 
    c.toLowerCase().includes(fromCity.toLowerCase())
  );

  const filteredToCities = cities.filter(c => 
    c.toLowerCase().includes(toCity.toLowerCase())
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (airlineRef.current && !airlineRef.current.contains(event.target)) {
        setShowAirlineDropdown(false);
      }
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setShowToDropdown(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // UPDATED: Added 'e' parameter and preventDefault to support Enter key submission
  const handleSearch = (e) => {
    if (e) e.preventDefault(); // Prevents page refresh on Enter key

    let newErrors = {};

    // 1. Logic for Validation
    if (searchType === 'flight') {
      if (!airline.trim()) newErrors.airline = "Please select an airline";
      if (!flightNumber.trim()) newErrors.flightNumber = "Please enter flight number";
    } else if (searchType === 'route') {
      if (!fromCity.trim()) newErrors.from = "Please enter departure city";
      if (!toCity.trim()) newErrors.to = "Please enter arrival city";
      if (fromCity && toCity && fromCity.toLowerCase() === toCity.toLowerCase()) {
        newErrors.to = "Cities cannot be the same";
      }
    }

    // 2. If errors exist, trigger effects
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsShaking(true);
      if (navigator.vibrate) navigator.vibrate(40);
      
      // Stop shaking after animation duration
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    // 3. Success Logic
    setErrors({}); // Clear errors
    const criteria = { searchType, airline, flightNumber, fromCity, toCity, selectedDate };
    if (onSearch) onSearch(criteria);
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const handleDateSelect = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(formattedDate);
    setShowCalendar(false);
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className={`search-bar-container-new ${isShaking ? 'shake-animation' : ''}`}>
      <div className="search-bar-new">
        <div className="flight-status-card-search">
          <h2 className="card-title-search">Check Flight Status</h2>

          <div className={`search-type-toggle-new ${searchType === 'flight' ? 'tab-1-active' : 'tab-2-active'}`}>
            <label className="radio-label-new">
              <input
                type="radio"
                name="searchType"
                value="flight"
                checked={searchType === 'flight'}
                onChange={(e) => { setSearchType(e.target.value); setErrors({}); }}
              />
              <span>By Flight</span>
            </label>

            <label className="radio-label-new">
              <input
                type="radio"
                name="searchType"
                value="route"
                checked={searchType === 'route'}
                onChange={(e) => { setSearchType(e.target.value); setErrors({}); }}
              />
              <span>By Route</span>
            </label>
            <div className="tab-indicator"></div>
          </div>

          {/* CHANGED: Wrapped in form to enable Enter key functionality */}
          <form className="search-form-new" onSubmit={handleSearch}>
            {searchType === 'flight' && (
              <>
                <div className="form-field-new" ref={airlineRef}>
                  <div className="label-row">
                    <label className="field-label-new">AIRLINE</label>
                    {errors.airline && <span className="error-tag">{errors.airline}</span>}
                  </div>
                  <div className="autocomplete-wrapper-new">
                    <input
                      type="text"
                      value={airline}
                      onChange={(e) => {
                        setAirline(e.target.value);
                        setShowAirlineDropdown(true);
                        if(errors.airline) setErrors({...errors, airline: null});
                      }}
                      onFocus={() => setShowAirlineDropdown(true)}
                      placeholder="Enter or select airline"
                      className={`field-input-new ${errors.airline ? 'input-error' : ''}`}
                    />
                    <ChevronDown 
                      className="dropdown-icon-new" 
                      size={20}
                      onClick={() => setShowAirlineDropdown(!showAirlineDropdown)}
                    />
                    {showAirlineDropdown && (
                      <div className="autocomplete-dropdown-new">
                        {filteredAirlines.length > 0 ? (
                          filteredAirlines.map((a) => (
                            <div
                              key={a}
                              className="autocomplete-item-new"
                              onClick={() => {
                                setAirline(a);
                                setShowAirlineDropdown(false);
                                setErrors({...errors, airline: null});
                              }}
                            >
                              {a}
                            </div>
                          ))
                        ) : (
                          <div className="autocomplete-item-new disabled">No matches found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-field-new">
                  <div className="label-row">
                    <label className="field-label-new">FLIGHT NUMBER</label>
                    {errors.flightNumber && <span className="error-tag">{errors.flightNumber}</span>}
                  </div>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => {
                      setFlightNumber(e.target.value);
                      if(errors.flightNumber) setErrors({...errors, flightNumber: null});
                    }}
                    placeholder="e.g., 6E-2341"
                    className={`field-input-new ${errors.flightNumber ? 'input-error' : ''}`}
                  />
                </div>
              </>
            )}

            {searchType === 'route' && (
              <>
                <div className="form-field-new" ref={fromRef}>
                  <div className="label-row">
                    <label className="field-label-new">FROM</label>
                    {errors.from && <span className="error-tag">{errors.from}</span>}
                  </div>
                  <div className="autocomplete-wrapper-new">
                    <input
                      type="text"
                      value={fromCity}
                      onChange={(e) => {
                        setFromCity(e.target.value);
                        setShowFromDropdown(true);
                        if(errors.from) setErrors({...errors, from: null});
                      }}
                      onFocus={() => setShowFromDropdown(true)}
                      placeholder="Enter or select city"
                      className={`field-input-new ${errors.from ? 'input-error' : ''}`}
                    />
                    <ChevronDown 
                      className="dropdown-icon-new" 
                      size={20}
                      onClick={() => setShowFromDropdown(!showFromDropdown)}
                    />
                    {showFromDropdown && (
                      <div className="autocomplete-dropdown-new">
                        {filteredFromCities.map((c) => (
                          <div
                            key={c}
                            className="autocomplete-item-new"
                            onClick={() => {
                              setFromCity(c);
                              setShowFromDropdown(false);
                              setErrors({...errors, from: null});
                            }}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-field-new" ref={toRef}>
                  <div className="label-row">
                    <label className="field-label-new">TO</label>
                    {errors.to && <span className="error-tag">{errors.to}</span>}
                  </div>
                  <div className="autocomplete-wrapper-new">
                    <input
                      type="text"
                      value={toCity}
                      onChange={(e) => {
                        setToCity(e.target.value);
                        setShowToDropdown(true);
                        if(errors.to) setErrors({...errors, to: null});
                      }}
                      onFocus={() => setShowToDropdown(true)}
                      placeholder="Enter or select city"
                      className={`field-input-new ${errors.to ? 'input-error' : ''}`}
                    />
                    <ChevronDown 
                      className="dropdown-icon-new" 
                      size={20}
                      onClick={() => setShowToDropdown(!showToDropdown)}
                    />
                    {showToDropdown && (
                      <div className="autocomplete-dropdown-new">
                        {filteredToCities.map((c) => (
                          <div
                            key={c}
                            className="autocomplete-item-new"
                            onClick={() => {
                              setToCity(c);
                              setShowToDropdown(false);
                              setErrors({...errors, to: null});
                            }}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="form-field-new" ref={calendarRef}>
              <label className="field-label-new">DATE</label>
              <div className="date-picker-wrapper-new">
                <div 
                  className="date-display-new"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <div>
                    <div className="date-text-new">{dateInfo.date}</div>
                    <div className="day-text-new">{dateInfo.day}</div>
                  </div>
                  <Calendar size={20} color="#2563eb" />
                </div>

                {showCalendar && (
                  <div className="calendar-dropdown-new">
                    <div className="calendar-header-new">
                      {/* type="button" prevents accidental form submission */}
                      <button type="button" className="calendar-nav-btn-new" onClick={() => changeMonth(-1)}>
                        <ChevronLeft size={20} />
                      </button>
                      <div className="calendar-month-new">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </div>
                      <button type="button" className="calendar-nav-btn-new" onClick={() => changeMonth(1)}>
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    <div className="calendar-grid-new">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="calendar-day-header-new">{day}</div>
                      ))}
                      {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                        <div key={`empty-${index}`} className="calendar-day-new empty"></div>
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;
                        const isSelected = selectedDate === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        return (
                          <button
                            type="button"
                            key={day}
                            className={`calendar-day-new ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleDateSelect(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-field-new search-btn-wrapper-new">
              {/* type="submit" ensures Enter key triggers handleSearch */}
              <button type="submit" className="search-btn-new">
                SEARCH
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;