import React, { useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';


function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchData, setSearchData] = useState(null);

  const handleSearch = (data) => {
    setSearchData(data);
    setCurrentPage('results');
  };

  const goToHome = () => {
    setCurrentPage('home');
  };

  return (
    <div className="app">
      
      {currentPage === 'home' && <HomePage onSearch={handleSearch} />}
      {currentPage === 'results' && <SearchResultsPage searchData={searchData} onBack={goToHome} />}
    </div>
  );
}

export default App;