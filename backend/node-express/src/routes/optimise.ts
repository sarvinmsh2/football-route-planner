import { Router } from 'express';
import * as MatchModel from '../models/Match';
import * as CityModel from '../models/City';
import * as FlightPriceModel from '../models/FlightPrice';
import { NearestNeighbourStrategy } from '../strategies/NearestNeighbourStrategy';
import { calculate } from '../utils/CostCalculator';
import { findBestValue } from '../bonus/BestValueFinder';

const router = Router();

// POST /api/route/optimise — Task #3
router.post('/optimise', (req, res) => {
  const { matchIds, originCityId } = req.body; // read matchIds and originCityId from the request body

  if (!matchIds || !Array.isArray(matchIds)) {
    res.status(400).json({ error: 'matchIds array is required' });  //validate that matchIds is provided and is an array and return a 400 Bad Request error if not
    return;
  } 

  const matches = MatchModel.getByIds(matchIds); // fetch match data from the model using the provided matchIds this will return an array of match objects corresponding to the provided IDs

  const strategy = new NearestNeighbourStrategy();
   const originCity = CityModel.getById(originCityId); // retrieve origin city if provided
  const route = strategy.optimise(matches, originCity); // generate optimised route using the strategy's optimise method, passing in the matches and the origin city

  res.json(route); // return the optimised route as a JSON response to the client
});

// POST /api/route/budget — Task #5
// calculates the best travel route within a user-defined budget 
router.post('/budget', (req, res) => {
  const { budget, matchIds, originCityId } = req.body; // extract budget, matchIds, and originCityId from the request body

  if (!matchIds || !Array.isArray(matchIds) || budget == null) {
    res.status(400).json({ error: 'budget and matchIds are required' }); // error handling for matchIds
    return;
  }

  const matches = MatchModel.getByIds(matchIds); //retrieve selected matches using the provided matchIds, this will return an array of match objects corresponding to the provided IDs
  const originCity = CityModel.getById(originCityId); //retrieve the origin city using the provided originCityId, this will return a city object corresponding to the provided ID

  if (!originCity) {
    res.status(400).json({ error: 'Invalid originCityId' }); // error handling for originCityId
    return;
  }

  const flightPrices = FlightPriceModel.getAll(); // retrieve all flight prices from the model, this will return an array of flight price objects
  const result = calculate(matches, budget, originCityId, flightPrices, originCity); //use calculate function from CostCalculator utility to calculate the best travel route within the specified budget, passing in the matches, budget, originCityId, flight prices, and origin city

  res.json(result); // return results as Json format
});

// POST /api/route/best-value — Bonus #1
router.post('/best-value', (req, res) => {
  const { budget, originCityId } = req.body; // extract budget and originCityId from the request body

  if (budget == null || !originCityId) {
    res.status(400).json({ error: 'budget and originCityId are required' }); // error handling for missing budget or originCityId
    return;
  }

  const allMatches = MatchModel.getAll(); // retrieve all matches from the model, this will return an array of match objects
  const originCity = CityModel.getById(originCityId); // retrieve the origin city using the provided originCityId, this will return a city object corresponding to the provided ID

  if (!originCity) {
    res.status(400).json({ error: 'Invalid originCityId' }); // error handling for invalid originCityId
    return;
  }

  const flightPrices = FlightPriceModel.getAll();// retrieve all flight prices from the model, this will return an array of flight price objects
  const result = findBestValue(allMatches, budget, originCityId, flightPrices, originCity);// use findBestValue function from BestValueFinder utility to calculate the best travel route within the specified budget, passing in all matches, budget, originCityId, flight prices, and origin city

  res.json(result); // return results as Json
});

export default router;