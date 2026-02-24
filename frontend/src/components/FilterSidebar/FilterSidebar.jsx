import  { useState } from 'react';
import './FilterSidebar.css';
import { ListFilter, ChevronDown, ChevronUp } from 'lucide-react';

function FilterSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([5260, 35446]);

  // Function to handle click toggling (primarily for mobile)
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div 
      className="filter-popover-wrapper"
      /* Desktop Hover Logic */
      onMouseEnter={() => {
        if (window.matchMedia('(pointer: fine)').matches) setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (window.matchMedia('(pointer: fine)').matches) setIsOpen(false);
      }}
    >
      <button 
        className={`filter-trigger-btn ${isOpen ? 'active' : ''}`}
        /* Mobile Click Logic */
        onClick={handleToggle}
      >
        <div className="filter-btn-content">
          <ListFilter size={18} color="#3b82f6" />
          <span className="filter-text">Filters</span>
          <span className="filter-count-badge">2</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu">
          <div className="filter-menu-header">
            <span>Popular Filters</span>
            <button 
              className="reset-link" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent closing the menu when clicking reset
                setPriceRange([5260, 35446]);
              }}
            >
              Reset
            </button>
          </div>
          
          <div className="filter-menu-section" onClick={(e) => e.stopPropagation()}>
             <label className="checkbox-item"><input type="checkbox" /> Non-stop</label>
             <label className="checkbox-item"><input type="checkbox" /> Morning Departure</label>
          </div>

          <div className="filter-menu-section" onClick={(e) => e.stopPropagation()}>
            <h4 className="price-label">Price Range</h4>
            <input 
              type="range" 
              min="5260" 
              max="35446" 
              value={priceRange[1]} 
              onChange={(e) => setPriceRange([5260, parseInt(e.target.value)])}
              className="price-slider-blue"
            />
            <div className="price-display">
              <span>₹{priceRange[0].toLocaleString()}</span>
              <span>₹{priceRange[1].toLocaleString()}</span>
            </div>
          </div>
          
          {/* Mobile Apply Button (Optional but good UX) */}
          <button 
            className="mobile-apply-btn" 
            onClick={() => setIsOpen(false)}
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterSidebar;