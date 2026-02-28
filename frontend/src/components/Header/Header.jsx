import React, { useEffect, useState } from "react";
import Flag from "react-world-flags";
import { ChevronDown, LogOut, User as UserIcon, Home } from "lucide-react";
import "./Header.css";
import Login from "../Auth/Login";

const languages = [
  { code: "IN", name: "Hindi", label: "HIN" },
  { code: "GB", name: "English", label: "ENG" },
  { code: "AE", name: "Arabic", label: "AR" },
  { code: "TH", name: "Thai", label: "TH" },
  { code: "FR", name: "French", label: "FR" },
  { code: "DE", name: "German", label: "DE" },
  { code: "JP", name: "Japanese", label: "JP" },
  { code: "IT", name: "Italian", label: "IT" },
  { code: "RU", name: "Russian", label: "RU" },
  { code: "CN", name: "Chinese", label: "ZH" },
  { code: "SG", name: "Singaporean", label: "SG" },
  { code: "TR", name: "Turkish", label: "TR" },
  { code: "VN", name: "Vietnamese", label: "VN" },
  { code: "KR", name: "Korean", label: "KR" },
  { code: "LK", name: "Sinhala", label: "SI" },
  { code: "NP", name: "Nepali", label: "NE" },
  { code: "MY", name: "Malay", label: "MS" },
  { code: "BD", name: "Bengali", label: "BN" },
  { code: "PH", name: "Filipino", label: "PH" },
  { code: "GE", name: "Georgian", label: "KA" },
  { code: "UZ", name: "Uzbek", label: "UZ" },
  { code: "PL", name: "Polish", label: "PL" },
];

const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "OMR", symbol: "﷼", name: "Oman Rial" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "NPR", symbol: "₨", name: "Nepalese Rupee" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [selectedCurr, setSelectedCurr] = useState(currencies[0]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const timer = setTimeout(() => {
      if (!localStorage.getItem("user")) {
        setIsLoginOpen(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  const onHomeClick = () => {
    window.location.href = "/";
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo Section */}
          <div className="header-left">
            <div className="logo" onClick={onHomeClick}>
              <span className="logo-flight">Flight</span>
              <span className="logo-tracker">Tracker</span>
            </div>
          </div>

          {/* Right Section Container */}
          <div className="header-right">
            <div className="header-actions">
              <button className="home-icon-btn" onClick={onHomeClick}>
                <Home size={16} className="mobile-home-icon" />
                <span>Home</span>
              </button>

              {user ? (
                <div className="user-nav-profile">
                  <div className="user-info">
                    <UserIcon size={16} />
                    <span className="user-name-text">
                      Hi, {user.name.split(" ")[0]}
                    </span>
                  </div>
                  <button
                    className="logout-icon-btn"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button
                  className="login-btn"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Login
                </button>
              )}

              {/* Language & Currency Dropdown */}
              <div
                className="lang-dropdown-wrapper"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <button className="lang-btn">
                  <Flag code={selectedLang.code} className="button-flag" />
                  <span className="divider-line">|</span>
                  <span className="currency-display">
                    {selectedCurr.symbol}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`arrow ${isMenuOpen ? "rotate" : ""}`}
                  />
                </button>

                {isMenuOpen && (
                  <div className="mega-menu">
                    <div className="menu-section">
                      <h4>Select Language</h4>
                      <div className="menu-grid">
                        {languages.map((lang) => (
                          <div
                            key={lang.code}
                            className={`menu-item ${selectedLang.code === lang.code ? "active" : ""}`}
                            onClick={() => setSelectedLang(lang)}
                          >
                            <Flag code={lang.code} className="flag-icon" />
                            <span>{lang.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="menu-section">
                      <h4>Select Currency</h4>
                      <div className="menu-grid">
                        {currencies.map((curr) => (
                          <div
                            key={curr.code}
                            className={`menu-item ${selectedCurr.code === curr.code ? "active" : ""}`}
                            onClick={() => setSelectedCurr(curr)}
                          >
                            <span className="currency-symbol">
                              {curr.symbol}
                            </span>
                            <span className="currency-name">
                              {curr.code} - {curr.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}

export default Header;
