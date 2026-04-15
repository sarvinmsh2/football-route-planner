import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLngExpression, DivIcon } from 'leaflet';
import { OptimisedRoute, City, ItineraryStop } from '../types';

// Centre of North America
const MAP_CENTRE: LatLngExpression = [39, -98];

// Creates numbered marker icon
function createMultiNumberedIcon(numbers: number[]): DivIcon {
  const label = numbers.join(', ');
  const width = Math.max(28, 12 + label.length * 8);

  return new DivIcon({
    className: 'numbered-marker',
    html: `<div class="marker-number marker-multi">${label}</div>`,
    iconSize: [width, 28],
    iconAnchor: [width / 2, 14],
  });
}

// Start marker icon
function createStartIcon(): DivIcon {
  return new DivIcon({
    className: 'numbered-marker',
    html: `<div class="marker-start">Start</div>`,
    iconSize: [40, 28],
    iconAnchor: [20, 14],
  });
}

// Group stops by city
function groupStopsByCity(stops: ItineraryStop[]): Map<string, ItineraryStop[]> {
  const grouped = new Map<string, ItineraryStop[]>();

  stops.forEach((stop) => {
    const cityId = stop.city.id;

    if (!grouped.has(cityId)) {
      grouped.set(cityId, []);
    }

    grouped.get(cityId)!.push(stop);
  });

  return grouped;
}

interface RouteMapProps {
  route: OptimisedRoute | null;
  originCity: City | null;
}

function RouteMap({ route, originCity }: RouteMapProps) {
  if (!route) {
    return (
      <div className="route-map-placeholder">
        <h3>Route Map</h3>
        <p>Validate a route to see it displayed on the map.</p>
      </div>
    );
  }

  // Build polyline positions
  const positions: LatLngExpression[] = [];

  if (originCity) {
    positions.push([originCity.latitude, originCity.longitude]);
  }

  route.stops.forEach((stop) => {
    positions.push([stop.city.latitude, stop.city.longitude]);
  });

  const groupedStops = groupStopsByCity(route.stops);

  return (
    <MapContainer
      center={MAP_CENTRE}
      zoom={3}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Origin marker */}
      {originCity && (
        <Marker
          position={[originCity.latitude, originCity.longitude]}
          icon={createStartIcon()}
        >
          <Popup>
            <strong>Start: {originCity.name}</strong>
            <br />
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              {originCity.country}
            </span>
          </Popup>
        </Marker>
      )}

      {/* City markers */}
      {Array.from(groupedStops.entries()).map(([cityId, stops]) => {
        const firstStop = stops[0];
        const stopNumbers = stops.map((s) => s.stopNumber);

        return (
          <Marker
            key={cityId}
            position={[
              firstStop.city.latitude,
              firstStop.city.longitude,
            ]}
            icon={createMultiNumberedIcon(stopNumbers)}
          >
            <Popup>
              <strong>{firstStop.city.name}</strong>
              <br />
              <span style={{ fontSize: '0.85em', color: '#666' }}>
                {firstStop.city.country}
              </span>

              <hr />

              {stops.map((stop) => (
                <div key={stop.stopNumber} className="popup-match">
                  <span className="popup-match-number">
                    Stop {stop.stopNumber}
                  </span>

                  <strong>
                    {stop.match.homeTeam.name} vs{' '}
                    {stop.match.awayTeam.name}
                  </strong>

                  <div className="popup-match-date">
                    {new Date(stop.match.kickoff).toLocaleDateString(
                      'en-GB',
                      {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    )}
                  </div>
                </div>
              ))}
            </Popup>
          </Marker>
        );
      })}

      <Polyline positions={positions} />
    </MapContainer>
  );
}

export default RouteMap;