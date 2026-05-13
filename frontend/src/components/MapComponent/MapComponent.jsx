import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GreatCircle } from 'arc';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const BACKUP_AIRPORTS = {
  "JFK": [40.6413, -73.7781],
  "LHR": [51.4700, -0.4543],
  "DEL": [28.5562, 77.1000],
  "DOH": [25.2731, 51.5585], 
  "DXB": [25.2532, 55.3657],
  "ORD": [41.9742, -87.9073]
};

// Simplified fetch for the component state
const getGlobalAirports = async () => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json');
    return await response.json();
  } catch (err) {
    console.error("External lookup failed", err);
    return {};
  }
};
// In your component:
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const createPlaneLabel = (flightNumber, depCode, arrCode) => {
  return new L.DivIcon({
    html: `
      <div style="
        background: rgba(0, 0, 0, 0.6);
        color: #ffffff;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        gap: 5px;
      ">
        <span style="color: #00ff00;">${flightNumber}</span>
        <span>${depCode} → ${arrCode}</span>
      </div>`,
    className: 'plane-label-container',
    iconSize: [0, 0],
    iconAnchor: [-20, 10],
  });
};

const createAirportIcon = (color) => {
  return new L.DivIcon({
    html: `
      <div style="position: relative; width: 12px; height: 12px;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          background: ${color};
          border-radius: 50%;
          z-index: 2;
          border: 2px solid white;
        "></div>
        <div class="ping-ring" style="border-color: ${color};"></div>
      </div>`,
    className: 'airport-ping-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const createPlaneIcon = (heading = 0, size = 40) => {
  return new L.DivIcon({
    html: `<div style="
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: ${size}px !important;
            height: ${size}px !important;
            transform: rotate(${heading}deg);
            transition: width 0.5s ease, height 0.5s ease;
          ">
             <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="White" style="
               display: block !important;
             ">
               <path d="M21 16L21 14L13 9L13 3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5L10 9L2 14L2 16L10 13.5L10 19L8 20.5L8 22L11.5 21L15 22L15 20.5L13 19L13 13.5L21 16Z"/>
             </svg>
           </div>`,
    className: 'plane-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const MapComponent = ({ selectedFlight }) => {
  const [livePos, setLivePos] = useState(null);
  const [heading, setHeading] = useState(0);
  const [telemetry, setTelemetry] = useState({ speed: 0, alt: 0 });
  const [status, setStatus] = useState("SCHEDULED");
  const [pathIndex, setPathIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(true);
  
  // NEW: State to store fetched coordinates
  const [dep, setDep] = useState(null);
  const [arr, setArr] = useState(null);

  // NEW: Effect to handle async coordinate lookup automatically
  useEffect(() => {
    const updateCoords = async () => {
      const getSingleCoord = async (iata) => {
        if (!iata) return null;
        const code = iata.toUpperCase();
        if (BACKUP_AIRPORTS[code]) return BACKUP_AIRPORTS[code];

        const allAirports = await getGlobalAirports();
        const found = Object.values(allAirports).find(a => a.iata === code);
        return found ? [parseFloat(found.lat), parseFloat(found.lon)] : [0, 0];
      };

      const depRes = await getSingleCoord(selectedFlight?.departure?.code);
      const arrRes = await getSingleCoord(selectedFlight?.arrival?.code);
      setDep(depRes);
      setArr(arrRes);
    };

    updateCoords();
    setLivePos(null);
    setPathIndex(0);
    setHeading(0);
    setStatus("SCHEDULED");
  }, [selectedFlight]);

  const curvedPath = useMemo(() => {
    if (!dep || !arr || (dep[0] === 0 && dep[1] === 0)) return [];
    try {
      const start = { x: dep[1], y: dep[0] };
      const end = { x: arr[1], y: arr[0] };
      const generator = new GreatCircle(start, end);
      const line = generator.Arc(100, { offset: 10 });
      return line.geometries[0].coords.map(c => [c[1], c[0]]);
    } catch (e) { return [dep, arr]; }
  }, [dep, arr]);

  const trailPath = useMemo(() => curvedPath.slice(0, pathIndex + 1), [curvedPath, pathIndex]);

  const planeSize = useMemo(() => {
    if (curvedPath.length === 0) return 40;
    const progress = pathIndex / (curvedPath.length - 1);
    return progress > 0.8 ? 20 + (20 * ((1 - progress) / 0.2)) : 40;
  }, [pathIndex, curvedPath]);

  const RecenterMap = ({ position }) => {
    const map = useMap();
    useEffect(() => {
      if (position) map.panTo(position, { animate: true, duration: 2 });
    }, [position, map]);
    return null;
  };

  const updateLocation = useCallback(async () => {
    if (!selectedFlight || !dep || !arr) return;

    try {
      let flightNum = selectedFlight.flightNumber.replace(/\s/g, '').toUpperCase();
      const callsignMap = { 'QR': 'QTR', 'AA': 'AAL', 'EK': 'UAE', 'BA': 'BAW', 'LH': 'DLH' };
      const prefix = flightNum.substring(0, 2);
      if (callsignMap[prefix]) {
        flightNum = callsignMap[prefix] + flightNum.substring(2);
      }

      const res = await fetch(`https://opensky-network.org/api/states/all`);
      if (res.ok) {
        const data = await res.json();
        const found = data.states?.find(s => s[1] && s[1].trim().toUpperCase() === flightNum);

        if (found && found[6] !== null) {
          setLivePos([found[6], found[5]]);
          setHeading(found[10] || 0);
          setTelemetry({ speed: Math.round(found[9] * 3.6), alt: Math.round(found[7] * 3.28) });
          setStatus("LIVE");
          return;
        }
      }
    } catch (e) { console.error("API error", e); }

    if (status !== "LIVE") setStatus("SIMULATED");
  }, [selectedFlight, dep, arr, status]);

  useEffect(() => {
    updateLocation();
    const apiTimer = setInterval(updateLocation, 30000);
    return () => clearInterval(apiTimer);
  }, [updateLocation]);

  useEffect(() => {
    if (status === "SIMULATED" && curvedPath.length > 0) {
      const moveInterval = setInterval(() => {
        setPathIndex((prev) => {
          const next = (prev + 1) % curvedPath.length;
          const currentPoint = curvedPath[next];
          const nextPoint = curvedPath[(next + 1) % curvedPath.length] || arr;
          if (currentPoint && nextPoint) {
            const lat1 = currentPoint[0] * Math.PI / 180;
            const lat2 = nextPoint[0] * Math.PI / 180;
            const dLng = (nextPoint[1] - currentPoint[1]) * Math.PI / 180;
            const y = Math.sin(dLng) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
            setLivePos(currentPoint);
            setHeading((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
          }
          return next;
        });
      }, 4000);
      return () => clearInterval(moveInterval);
    }
  }, [status, curvedPath, arr]);

  // Updated Guard: Only return null if coordinates aren't loaded yet
  if (!selectedFlight || !dep || !arr) return null;

  return (
    <div className="map-container-wrapper">
      <style>{`
        .plane-marker-icon { background: transparent !important; border: none !important; }
        .leaflet-marker-icon { transition: all 2s linear !important; }
        .flight-info-card {
          position: absolute; bottom: 15px; left: 15px; right: 15px;
          background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
          padding: 12px 18px; z-index: 1000; color: white;
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          transition: transform 0.3s ease;
        }
        .telemetry-item { display: flex; flex-direction: column; }
        .telemetry-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; }
        .telemetry-value { font-size: 16px; font-weight: 700; color: #3b82f6; }
        .recenter-btn {
          position: absolute; top: 60px; right: 16px; z-index: 1000;
          background: #3b82f6; color: white; border: none; padding: 8px;
          border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold;
        }
      `}</style>

      <button className="recenter-btn" onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? "Hide Info" : "Show Info"}
      </button>

      <div className={`map-status-pill ${status.toLowerCase()}`}>
        <span className="pulse"></span> {status} POSITION
      </div>

      <MapContainer
        key={selectedFlight?.flightNumber}
        center={dep && !isNaN(dep[0]) ? dep : [20, 0]}
        zoom={3}
        maxBounds={[[-90, -180], [90, 180]]}
        worldCopyJump={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%', background: '#001a33' }}
      >
<TileLayer
  url="https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png"
  attribution='&copy; <a href="https://openfreemap.org">OpenFreeMap</a>'
  maxZoom={20}
/>
<TileLayer
  url="https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png"
  opacity={0.9}
/>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          opacity={0.9}
        />
        <RecenterMap position={livePos} />

        {curvedPath && curvedPath.length > 0 && (
          <Polyline
            positions={curvedPath}
            pathOptions={{ color: '#ffffff', weight: 1, dashArray: '5, 10', opacity: 0.5 }}
          />
        )}

        {trailPath && trailPath.length > 0 && (
          <Polyline
            positions={trailPath}
            pathOptions={{ color: '#00ff51', weight: 3, opacity: 1, lineJoin: 'round', dashArray: '0' }}
          />
        )}

        {dep && !isNaN(dep[0]) && (
          <Marker position={dep} icon={createAirportIcon('#f97316')}>
            <Popup>Departure: {selectedFlight.departure.city}</Popup>
          </Marker>
        )}

        {arr && !isNaN(arr[0]) && (
          <Marker position={arr} icon={createAirportIcon('#22c55e')}>
            <Popup>Arrival: {selectedFlight.arrival.city}</Popup>
          </Marker>
        )}

        {livePos && !isNaN(livePos[0]) && (
          <>
            <Marker position={livePos} icon={createPlaneIcon(heading, planeSize)} zIndexOffset={1000}>
              <Popup>Tracking {selectedFlight.flightNumber}</Popup>
            </Marker>
            <Marker
              position={livePos}
              icon={createPlaneLabel(
                selectedFlight.flightNumber || "N/A",
                selectedFlight.departure?.code || "DEP",
                selectedFlight.arrival?.code || "ARR"
              )}
              zIndexOffset={999}
              interactive={false}
            />
          </>
        )}
      </MapContainer>

      {showDetails && (
        <div className="flight-info-card">
          <div className="telemetry-item">
            <span className="telemetry-label">ALTITUDE</span>
            <span className="telemetry-value">{telemetry.alt.toLocaleString()} FT</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">SPEED</span>
            <span className="telemetry-value">{telemetry.speed} KM/H</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">HEADING</span>
            <span className="telemetry-value">{Math.round(heading)}°</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;


