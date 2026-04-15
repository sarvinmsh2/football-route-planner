/// <reference types="jest" />
import { NearestNeighbourStrategy } from '../src/strategies/NearestNeighbourStrategy';
import { MatchWithCity } from '../src/strategies/RouteStrategy';
// for these tests we are using jest which allows us to run TypeScript tests directly without needing to compile first. This is configured in package.json and jest.config.js


const createCity = (
  id: string,
  name: string,
  country: string,
  latitude: number,
  longitude: number
) => ({
  id,
  name,
  country,
  latitude,
  longitude,
  stadium: `${name} Stadium`,
  accommodation_per_night: 100,
});

const createTeam = (id: string, name: string) => ({
  id,
  name,
  code: id,
  group: 'A',
});
// Test suite for NearestNeighbourStrategy optimisation algorithm
describe('NearestNeighbourStrategy', () => {
  let strategy: NearestNeighbourStrategy;
// create a new instance of the strategy before each test to ensure isolation
  beforeEach(() => {
    strategy = new NearestNeighbourStrategy();
  });

  it('should return a valid route for multiple matches (happy path)', () => {
    const matches: MatchWithCity[] = [
      {
        id: '1',
        kickoff: '2026-01-01T12:00:00Z',
        homeTeam: createTeam('HT1', 'Arsenal'),
        awayTeam: createTeam('AT1', 'Chelsea'),
        group: 'A',
        matchDay: 1,
        ticketPrice: 100,
        city: createCity('LON', 'London', 'UK', 51.5074, -0.1278),
      },
      {
        id: '2',
        kickoff: '2026-01-02T12:00:00Z',
        homeTeam: createTeam('HT2', 'PSG'),
        awayTeam: createTeam('AT2', 'Marseille'),
        group: 'A',
        matchDay: 2,
        ticketPrice: 120,
        city: createCity('PAR', 'Paris', 'France', 48.8566, 2.3522),
      },
      {
        id: '3',
        kickoff: '2026-01-03T12:00:00Z',
        homeTeam: createTeam('HT3', 'Bayern'),
        awayTeam: createTeam('AT3', 'Dortmund'),
        group: 'A',
        matchDay: 3,
        ticketPrice: 110,
        city: createCity('BER', 'Berlin', 'Germany', 52.52, 13.405),
      },
    ];

    const result = strategy.optimise(matches);

    expect(result.stops.length).toBe(3); // making sure all stops are included
    expect(result.totalDistance).toBeGreaterThan(0);// distance should be calculated
    expect(result.strategy).toBe('nearest-neighbour');// strategy name should be correct this checks te json file to have nearest-neighbour 
  });

  it('should return an empty route for empty matches', () => {
    const matches: MatchWithCity[] = [];

    const result = strategy.optimise(matches);
    //checks for graceful handling of no data and making sure there's no crashes
    expect(result.stops).toEqual([]);
    expect(result.totalDistance).toBe(0);
  });

  it('should return zero distance for a single match', () => {
    const matches: MatchWithCity[] = [
      {
        id: '1',
        kickoff: '2026-01-01T12:00:00Z',
        homeTeam: createTeam('HT1', 'Arsenal'),
        awayTeam: createTeam('AT1', 'Chelsea'),
        group: 'A',
        matchDay: 1,
        ticketPrice: 100,
        city: createCity('LON', 'London', 'UK', 51.5074, -0.1278),
      },
    ];

    const result = strategy.optimise(matches);

    expect(result.stops.length).toBe(1); // if there's a single match, there should be one stop only 
    expect(result.totalDistance).toBe(0);// the distance should be zero since there's no travel needed
  });
});