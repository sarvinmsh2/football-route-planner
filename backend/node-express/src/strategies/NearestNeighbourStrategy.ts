import { RouteStrategy, MatchWithCity, OptimisedRoute, City } from './RouteStrategy';
import { buildRoute } from '../utils/buildRoute';
import { calculateDistance } from '../utils/haversine';

// Task 3: Nearest Neighbour Strategy
export class NearestNeighbourStrategy implements RouteStrategy {
  private static readonly STRATEGY_NAME = 'nearest-neighbour';
  private static readonly REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];
  private static readonly MINIMUM_MATCHES = 5;


  optimise(matches: MatchWithCity[], originCity?: City): OptimisedRoute {
    if (!matches || matches.length === 0) return this.createEmptyRoute();
    // step 1 sort matches by time of the kickoff from matches.ts
    const sorted = [...matches].sort((a,b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()); // algorithm uses kickoff to know which matches happen in the same day 
    // step 2 group by date
    const byDate = new Map <string, MatchWithCity[]>();
    for (const match of sorted){
      const date = match.kickoff.split('T')[0];
      if(!byDate.has(date)) byDate.set(date,[]);
      byDate.get(date)!.push(match);
    }
    //step 3 for each day pick nearest match
    const orderedMatches: MatchWithCity[] = [];
    let currentCity = originCity ?? sorted[0].city; // start from origin city or if not provided the first match
    // loop to process each day 
    for (const[,dayMatches] of byDate){
      let chosen = dayMatches.length === 1 // if there's only one match attend it otherwise calculate nearst distance
        ?dayMatches[0]
        :dayMatches.reduce((nearest,candidate)=>{ 
          const dNearest = calculateDistance(currentCity.latitude, currentCity.longitude,
            nearest.city.latitude, nearest.city.longitude ) 
          const dCandidate = calculateDistance(currentCity.latitude, currentCity.longitude,
            candidate.city.latitude, candidate.city.longitude);
          return dCandidate < dNearest ? candidate: nearest;
          });
     orderedMatches.push(chosen);
     currentCity = chosen.city;

    }
    const route = this.buildRoute(orderedMatches, originCity);
    this.validateRoute(route, orderedMatches);
    return route;
  }


  /**
   * Creates an empty route with appropriate warnings.
   */
  private createEmptyRoute(): OptimisedRoute {
    return {
      stops: [],
      totalDistance: 0,
      strategy: NearestNeighbourStrategy.STRATEGY_NAME,
      feasible: false,
      warnings: ['No matches selected', `Must select at least ${NearestNeighbourStrategy.MINIMUM_MATCHES} matches`],
      countriesVisited: [],
      missingCountries: [...NearestNeighbourStrategy.REQUIRED_COUNTRIES],
    };
  }

  /**
   * Builds an optimised route from ordered matches, including origin city distance.
   */
  // build the route this is later used in optimise
  private buildRoute(orderedMatches: MatchWithCity[], originCity?: City): OptimisedRoute {
    const route = buildRoute(orderedMatches, NearestNeighbourStrategy.STRATEGY_NAME);

    // Add distance from origin city to first match
    if (originCity && route.stops.length > 0) {
      const firstStop = route.stops[0];
      const distanceFromOrigin = calculateDistance(
        originCity.latitude,
        originCity.longitude,
        firstStop.city.latitude,
        firstStop.city.longitude
      );
      firstStop.distanceFromPrevious = distanceFromOrigin;
      route.totalDistance += distanceFromOrigin;
    }

    return route;
  }
  private validateRoute(route: OptimisedRoute, matches: MatchWithCity[]): void{
    const warnings: string [] = [];
    if(matches.length<5) warnings.push('Need at least 5 matches') // make sure at least 5 matches selected
    const countriesVisited = [...new Set(matches.map(m => m.city.country))];
    const missingCountries = NearestNeighbourStrategy.REQUIRED_COUNTRIES.filter(c => !countriesVisited.includes(c));
    if (missingCountries.length > 0) warnings.push('Missing: ' + missingCountries.join(', '));
    route.feasible = warnings.length === 0;  // ← feasible only if no warnings
    route.warnings = warnings;
    route.countriesVisited = countriesVisited;
    route.missingCountries = missingCountries;

  }
}
