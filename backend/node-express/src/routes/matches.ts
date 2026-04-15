import { Router, Request, Response } from 'express';
import * as MatchModel from '../models/Match';

const router = Router();


//Task 2: GET/api/,matches with filters for city and date
router.get('/', (req, res) => {
  const { city , date } = req.query; // reads city? and date? from the URL
  const filters: {city?: string; date?: string } = {};// building our constant obj holding date and city 
  if (typeof city == 'string') filters.city = city;
  if (typeof date == 'string') filters.date = date; // only add the filter if provided 
  const matches = MatchModel.getAll(Object.keys(filters).length > 0 ? filters: undefined) // if no filter exist (filter length is 0) then assign undefined
  res.json(matches); // respond with matches 
});

// Task2: GET /api/matches/:id — Return a single match by ID

router.get('/:id', (req, res) => {
  const match = MatchModel.getById(req.params.id); //look up by ID
  if(!match){
    res.status(404).json({error:'Match not found'}); // error handling if nothing is returned
  }
  res.json(match);//respond with the match if found

});

export default router;
