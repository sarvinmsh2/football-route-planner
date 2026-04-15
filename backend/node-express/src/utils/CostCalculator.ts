import {
  MatchWithCity,
  FlightPrice,
  BudgetResult,
  CostBreakdown,
  City,
} from '../strategies/RouteStrategy';
import { buildRoute } from './buildRoute';
import { calculateDistance } from './haversine';

const REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];

export function calculate(
  matches: MatchWithCity[],
  budget: number,
  originCityId: string,
  flightPrices: FlightPrice[],
  originCity: City
): BudgetResult {
  // Step 1: Sort matches by kickoff date
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  // Step 2: Find countries visited and missing
  const countriesVisited = [...new Set(sortedMatches.map((m) => m.city.country))];
  const missingCountries = REQUIRED_COUNTRIES.filter((c) => !countriesVisited.includes(c));

  // Step 3: Calculate costs
  const ticketsCost = calculateTicketsCost(sortedMatches);
  const flightsCost = calculateFlightsCost(originCity, sortedMatches, flightPrices);
  const accommodationCost = calculateAccommodationCost(sortedMatches);
  const totalCost = ticketsCost + flightsCost + accommodationCost;

  // Step 4: Build cost breakdown
  const costBreakdown: CostBreakdown = {
    flights: flightsCost,
    accommodation: accommodationCost,
    tickets: ticketsCost,
    total: totalCost,
  };

  // Step 5: Determine feasibility
  const feasible = missingCountries.length === 0 && totalCost <= budget;

  // Step 6: Generate suggestions
  const suggestions = generateSuggestions(missingCountries, totalCost, budget, sortedMatches);

  // Step 7: Build route
  const route = buildRoute(sortedMatches, 'budget-optimised');

  return {
    feasible,
    route,
    costBreakdown,
    countriesVisited,
    missingCountries,
    minimumBudgetRequired: totalCost > budget ? totalCost : undefined,
    suggestions,
  };
}

// ============================================================
//  Helper Methods (provided - no changes needed)
// ============================================================

function generateSuggestions(
  missingCountries: string[],
  totalCost: number,
  budget: number,
  matches: MatchWithCity[]
): string[] {
  const suggestions: string[] = [];

  if (missingCountries.length > 0) {
    suggestions.push(`Add matches in: ${missingCountries.join(', ')}`);
  }

  if (totalCost > budget) {
    suggestions.push(`You need $${(totalCost - budget).toFixed(2)} more to complete this trip`);

    const sortedByPrice = [...matches].sort(
      (a, b) => getMatchTicketPrice(b) - getMatchTicketPrice(a)
    );
    if (sortedByPrice.length > 0) {
      const mostExpensive = sortedByPrice[0];
      const price = getMatchTicketPrice(mostExpensive);
      suggestions.push(
        `Consider removing ${mostExpensive.homeTeam.name} vs ${mostExpensive.awayTeam.name} to save $${price.toFixed(2)} on tickets`
      );
    }
  }

  return suggestions;
}

function calculateTicketsCost(matches: MatchWithCity[]): number {
  return matches.reduce((sum, match) => sum + getMatchTicketPrice(match), 0);
}

function getMatchTicketPrice(match: MatchWithCity): number {
  return match.ticketPrice ?? 150.0;
}

function calculateFlightsCost(
  originCity: City,
  matches: MatchWithCity[],
  flightPrices: FlightPrice[]
): number {
  if (matches.length === 0) return 0;

  let totalFlightCost = 0;

  const firstMatchCity = matches[0].city;
  totalFlightCost += getFlightPrice(originCity, firstMatchCity, flightPrices);

  for (let i = 0; i < matches.length - 1; i++) {
    const fromCity = matches[i].city;
    const toCity = matches[i + 1].city;
    if (fromCity.id !== toCity.id) {
      totalFlightCost += getFlightPrice(fromCity, toCity, flightPrices);
    }
  }

  return totalFlightCost;
}

function getFlightPrice(from: City, to: City, flightPrices: FlightPrice[]): number {
  if (from.id === to.id) return 0;

  const exactPrice = flightPrices.find(
    (fp) => fp.origin_city_id === from.id && fp.destination_city_id === to.id
  );

  if (exactPrice) {
    return exactPrice.price_usd;
  }

  const distance = calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  return Math.round(distance * 0.1 * 100) / 100;
}

function calculateAccommodationCost(matches: MatchWithCity[]): number {
  if (matches.length < 2) {
    if (matches.length === 1) {
      return matches[0].city.accommodation_per_night;
    }
    return 0;
  }

  let totalAccommodation = 0;

  for (let i = 0; i < matches.length - 1; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    const currentDate = new Date(currentMatch.kickoff);
    const nextDate = new Date(nextMatch.kickoff);
    let nights = Math.ceil(
      (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    nights = Math.max(1, nights);

    const nightlyRate = currentMatch.city.accommodation_per_night;
    totalAccommodation += nights * nightlyRate;
  }

  totalAccommodation += matches[matches.length - 1].city.accommodation_per_night;

  return totalAccommodation;
}
