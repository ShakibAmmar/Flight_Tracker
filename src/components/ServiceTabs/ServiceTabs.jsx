
import './ServiceTabs.css';
import { 
  Plane,  
  MapPin, ShipIcon 
} from 'lucide-react';

function ServiceTabs() {
  const services = [
    { icon: Plane, name: 'Flights', active: true, color: '#2563eb' },
    { icon: MapPin, name: 'Live Tracking', badge: 'new', color: '#2563eb' },
     { icon: ShipIcon, name: 'Ship',badge: 'new', color: '#2563eb' },
     
     /*
    
    { icon: Hotel, name: 'Hotels', color: '#2563eb' },
    { icon: Train, name: 'Trains', color: '#2563eb' },
    { icon: Bus, name: 'Buses', color: '#2563eb' },
    { icon: Car, name: 'Cabs', color: '#2563eb' },
    { icon: FileText, name: 'Visa', badge: 'new', color: '#2563eb' },
    { icon: CreditCard, name: 'Forex', color: '#2563eb' },*/

  ];

  return (
    <div className="service-tabs-container">
      <div className="service-tabs">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <button 
              key={index} 
              className={`service-tab ${service.active ? 'active' : ''}`}
            >
              <div 
                className="service-icon-wrapper" 
                style={{ '--brand-color': service.color }}
              >
                <Icon className="service-icon" size={27} strokeWidth={2.5} />
                {service.badge && (
                  <span className="service-badge">{service.badge}</span>
                )}
              </div>
              <span className="service-label">{service.name}</span>
              {service.active && <div className="active-underline"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ServiceTabs;