import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RouteMap from '../src/components/RouteMap';
import { OptimisedRoute } from '../src/types';

/**
 * using jest, react testing library, and jest-dom to test the RouteMap component
 */
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: any) => <div>{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
}));

/* Mock Data Helpers */

  const mockCity = {
    id: 'city-1',
    name: 'London',
    country: 'UK',
    latitude: 51.5,
    longitude: -0.1,
    accommodation_per_night: 100,
    stadium: 'London Stadium',
    accommodationPerNight: 100,
  };

function createMockRoute(stopCount: number): OptimisedRoute {
  return {
    stops: Array.from({ length: stopCount }).map((_, i) => ({
      stopNumber: i + 1,
      city: {
        ...mockCity,
        id: `city-${i}`,
        name: `City ${i}`,
      },
      match: {
        homeTeam: { name: 'Team A' },
        awayTeam: { name: 'Team B' },
        kickoff: new Date().toISOString(),
      },
    })),
  } as unknown as OptimisedRoute;
}


/* Tests */


describe('RouteMap', () => {


  // Test: Component shows placeholder text when no route is provided
  // Ensures user sees guidance instead of an empty map
  it('should render placeholder message when route is null', () => {
    render(<RouteMap route={null} originCity={null} />);

    expect(
      screen.getByText(/validate a route to see it displayed/i)
    ).toBeInTheDocument();
  });


   // Test: Map container renders when a valid route exists
  // Confirms the map UI loads correctly with route data
  it('should render a map container when route is provided', () => {
    const route = createMockRoute(2);

    render(<RouteMap route={route} originCity={mockCity} />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });



  // Test: A marker is rendered for every stop plus the origin city
  // Verifies route stops are correctly visualised on the map
  it('should render a marker for each stop in the route', () => {
    const route = createMockRoute(3);

    render(<RouteMap route={route} originCity={mockCity} />);

    // +1 marker for origin city
    const markers = screen.getAllByTestId('marker');

    expect(markers.length).toBe(4);
  });


  // Test: Component handles routes with no stops gracefully
  // Map should still render and only display the origin marker
  it('should handle route with empty stops array', () => {
    const route = createMockRoute(0);

    render(<RouteMap route={route} originCity={mockCity} />);

    // Map still renders
    expect(screen.getByTestId('map-container')).toBeInTheDocument();

    // Only origin marker exists
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(1);
  });

});

// Testing stack:
// - Jest: test runner & assertions
// - React Testing Library: component rendering and DOM queries
// - jest-dom: custom DOM matchers