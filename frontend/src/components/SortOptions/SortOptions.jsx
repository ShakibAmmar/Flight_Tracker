import React, { useState } from 'react';
import './SortOptions.css';
import { ChevronDown, ThumbsUp, DollarSign, Zap } from 'lucide-react';

function SortOptions() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSort, setActiveSort] = useState('best');

  const options = [
    { id: 'best', label: 'Best', icon: <ThumbsUp size={18} />, desc: '₹5,260 • 02h 00m' },
    { id: 'cheapest', label: 'Cheapest', icon: <DollarSign size={18} />, desc: '₹5,100 • 04h 30m' },
    { id: 'fastest', label: 'Fastest', icon: <Zap size={18} />, desc: '₹7,200 • 01h 15m' },
  ];

  const currentOption = options.find(opt => opt.id === activeSort);

  // Function to handle toggling manually (for mobile/tablets)
  const handleToggle = (e) => {
    // Prevent event bubbling if necessary
    setIsOpen(!isOpen);
  };

  return (
    <div 
      className="sort-container"
      /* Hover Logic: Only triggers if device has a fine pointer (Mouse) */
      onMouseEnter={() => {
        if (window.matchMedia('(pointer: fine)').matches) setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (window.matchMedia('(pointer: fine)').matches) setIsOpen(false);
      }}
    >
      <button 
        className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
        /* Click Logic: Essential for Mobile */
        onClick={handleToggle}
      >
        <div className="trigger-content">
          <span className="trigger-label">Sort by: <strong>{currentOption.label}</strong></span>
          <span className="trigger-sub">{currentOption.desc}</span>
        </div>
        <ChevronDown className={`chevron ${isOpen ? 'open' : ''}`} size={20} />
      </button>

      {isOpen && (
        <div className="sort-menu">
          {options.map((option) => (
            <button 
              key={option.id}
              className={`menu-item ${activeSort === option.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation(); // Prevents the trigger's onClick from firing
                setActiveSort(option.id);
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">{option.icon}</span>
              <div className="menu-text">
                <span className="menu-label">{option.label}</span>
                <span className="menu-sub">{option.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SortOptions;