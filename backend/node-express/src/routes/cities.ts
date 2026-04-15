import { Router } from 'express';
import * as CityModel from '../models/City';


const router = Router();

//Task #1: GET/api/cities  return all 16 cities from our DB in json format
router.get('/', (_req, res) => {
  const cities = CityModel.getAll(); // get all 16 cities from our DB
  res.json(cities); // send them back in json format
});

export default router;
