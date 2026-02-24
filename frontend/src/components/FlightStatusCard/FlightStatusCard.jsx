import { useState, useRef, useEffect } from 'react';
import './FlightStatusCard.css';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { airlines, cities } from '../../constants/data';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    day: days[date.getDay()],
    date: `${date.getDate()} ${months[date.getMonth()]}'${String(date.getFullYear()).slice(2)}`
  };
};

function FlightStatusCard({ onSearch, prefilledData }) {
  const [searchType, setSearchType] = useState('flight');
  const [flightNumber, setFlightNumber] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [airline, setAirline] = useState('');
// Helper to get today's date in YYYY-MM-DD format
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [errors, setErrors] = useState({});

// funtion for clear all inputs
const handleClearAll = () => {
  setFlightNumber('');
  setFromCity('');
  setToCity('');
  setAirline('');
  setErrors({});
  setSelectedDate(new Date().toISOString().split('T')[0]);
};
  
  useEffect(() => {
    if (prefilledData) {
      
      setFlightNumber(prefilledData.flightNumber || "");
      setAirline(prefilledData.airline || "");
      
      setFromCity(prefilledData.origin || "");
      setToCity(prefilledData.destination || "");
      
      if (prefilledData.date) {
        setSelectedDate(prefilledData.date);
        // Sync the calendar view to the prefilled month
        const newDateObj = new Date(prefilledData.date);
        setCurrentMonth(new Date(newDateObj.getFullYear(), newDateObj.getMonth(), 1));
      }
      
      setSearchType(prefilledData.searchType || "flight");
      
      setErrors({}); 
    }
  }, [prefilledData]); 

  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  
  const airlineRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const calendarRef = useRef(null);

  const dateInfo = formatDate(selectedDate);

  const filteredAirlines = airlines.filter(a => a.toLowerCase().includes(airline.toLowerCase()));
  const filteredFromCities = cities.filter(c => c.toLowerCase().includes(fromCity.toLowerCase()));
  const filteredToCities = cities.filter(c => c.toLowerCase().includes(toCity.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (airlineRef.current && !airlineRef.current.contains(event.target)) setShowAirlineDropdown(false);
      if (fromRef.current && !fromRef.current.contains(event.target)) setShowFromDropdown(false);
      if (toRef.current && !toRef.current.contains(event.target)) setShowToDropdown(false);
      if (calendarRef.current && !calendarRef.current.contains(event.target)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    console.log("Event type:");
    console.log(e);
    if (e) e.preventDefault(); 
    
    let validationErrors = {};

    if (searchType === 'flight') {
      if (!airline.trim()) validationErrors.airline = "Please select an airline";
      if (!flightNumber.trim()) validationErrors.flightNumber = "Please enter flight number";
    } else {
      if (!fromCity.trim()) validationErrors.fromCity = "Please enter departure city";
      if (!toCity.trim()) validationErrors.toCity = "Please enter destination city";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; 
    }

    const searchData = { searchType, airline, flightNumber, fromCity, toCity, selectedDate };
    setErrors({});
    if (onSearch) onSearch(searchData);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="flight-status-card">
      <h2 className="card-title">Check Flight Status</h2>
<button 
      type="button" 
      className="clear-all-btn" 
      onClick={handleClearAll}
    >
      Clear All
    </button>
      <div className="search-type-toggle">
        <label className="radio-label">
          <input type="radio" name="searchType" value="flight" checked={searchType === 'flight'} onChange={(e) => { setSearchType(e.target.value); setErrors({}); }} />
          <span>By Flight</span>
        </label>
        <label className="radio-label">
          <input type="radio" name="searchType" value="route" checked={searchType === 'route'} onChange={(e) => { setSearchType(e.target.value); setErrors({}); }} />
          <span>By Route</span>
        </label>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        {searchType === 'flight' && (
          <> 
            <div className="form-field" ref={airlineRef}>
              <div className="label-row">
                <label className="field-label">AIRLINE</label>
                {errors.airline && <span className="error-alert">{errors.airline}</span>}
              </div>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  value={airline}
                  onChange={(e) => { setAirline(e.target.value); setShowAirlineDropdown(true); setErrors(prev => ({...prev, airline: null})); }}
                  onFocus={() => setShowAirlineDropdown(true)}
                  placeholder="Enter or select airline"
                  className={`field-input ${errors.airline ? 'input-error' : ''}`}
                />
                <ChevronDown className="dropdown-icon" size={20} onClick={() => setShowAirlineDropdown(!showAirlineDropdown)} />
                {showAirlineDropdown && (
                  <div className="autocomplete-dropdown">
                    {filteredAirlines.length > 0 ? filteredAirlines.map((a) => (
                      <div key={a} className="autocomplete-item" onClick={() => { setAirline(a); setShowAirlineDropdown(false); setErrors(prev => ({...prev, airline: null})); }}>{a}</div>
                    )) : <div className="autocomplete-item disabled">No matches found</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field">
              <div className="label-row">
                <label className="field-label">FLIGHT No.</label>
                {errors.flightNumber && <span className="error-alert">{errors.flightNumber}</span>}
              </div>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => { setFlightNumber(e.target.value); setErrors(prev => ({...prev, flightNumber: null})); }}
                placeholder="e.g., 6E-2341"
                className={`field-input ${errors.flightNumber ? 'input-error' : ''}`}
              />
            </div>
          </>
        )}

        {searchType === 'route' && (
          <>
            <div className="form-field" ref={fromRef}>
              <div className="label-row">
                <label className="field-label">FROM</label>
                {errors.fromCity && <span className="error-alert">{errors.fromCity}</span>}
              </div>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  value={fromCity}
                  onChange={(e) => { setFromCity(e.target.value); setShowFromDropdown(true); setErrors(prev => ({...prev, fromCity: null})); }}
                  onFocus={() => setShowFromDropdown(true)}
                  placeholder="Enter or select city"
                  className={`field-input ${errors.fromCity ? 'input-error' : ''}`}
                />
                <ChevronDown className="dropdown-icon" size={20} onClick={() => setShowFromDropdown(!showFromDropdown)} />
                {showFromDropdown && (
                  <div className="autocomplete-dropdown">
                    {filteredFromCities.length > 0 ? filteredFromCities.map((c) => (
                      <div key={c} className="autocomplete-item" onClick={() => { setFromCity(c); setShowFromDropdown(false); setErrors(prev => ({...prev, fromCity: null})); }}>{c}</div>
                    )) : <div className="autocomplete-item disabled">No matches found</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field" ref={toRef}>
              <div className="label-row">
                <label className="field-label">TO</label>
                {errors.toCity && <span className="error-alert">{errors.toCity}</span>}
              </div>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  value={toCity}
                  onChange={(e) => { setToCity(e.target.value); setShowToDropdown(true); setErrors(prev => ({...prev, toCity: null})); }}
                  onFocus={() => setShowToDropdown(true)}
                  placeholder="Enter or select city"
                  className={`field-input ${errors.toCity ? 'input-error' : ''}`}
                />
                <ChevronDown className="dropdown-icon" size={20} onClick={() => setShowToDropdown(!showToDropdown)} />
                {showToDropdown && (
                  <div className="autocomplete-dropdown">
                    {filteredToCities.length > 0 ? filteredToCities.map((c) => (
                      <div key={c} className="autocomplete-item" onClick={() => { setToCity(c); setShowToDropdown(false); setErrors(prev => ({...prev, toCity: null})); }}>{c}</div>
                    )) : <div className="autocomplete-item disabled">No matches found</div>}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="form-field" ref={calendarRef}>
          <label className="field-label">DATE</label>
          <div className="date-picker-wrapper">
            <div className="date-display" onClick={() => setShowCalendar(!showCalendar)}>
              <div>
                <div className="date-text">{dateInfo.date}</div>
                <div className="day-text">{dateInfo.day}</div>
              </div>
              <Calendar size={20} color="#2563eb" />
            </div>
            {showCalendar && (
              <div className="calendar-dropdown">
                <div className="calendar-header">
                  <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                  <div className="calendar-month">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
                  <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                </div>
                <div className="calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (<div key={day} className="calendar-day-header">{day}</div>))}
                  {Array.from({ length: startingDayOfWeek }).map((_, index) => (<div key={`empty-${index}`} className="calendar-day empty"></div>))}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const isSelected = selectedDate === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    return (<button type="button" key={day} className={`calendar-day ${isSelected ? 'selected' : ''}`} onClick={() => handleDateSelect(day)}>{day}</button>);
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-field search-btn-wrapper">
          <button type="submit" className="search-btn">SEARCH</button>
        </div>
      </form>
    </div>
  );
}

export default FlightStatusCard;