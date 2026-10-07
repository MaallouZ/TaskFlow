import {Router} from 'express';
import * as habitController from '../controllers/habitController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export const habitRouter = Router();
habitRouter.use(requireAuth);

habitRouter.post('/', habitController.createHabit);
habitRouter.get('/', habitController.getAllHabits);
habitRouter.get('/:habitId', habitController.getHabitById);
habitRouter.patch('/:habitId', habitController.updateHabit);
habitRouter.delete('/:habitId', habitController.deleteHabit);
habitRouter.put('/:habitId/completions/:date', habitController.addCompletion);
habitRouter.delete('/:habitId/completions/:date', habitController.removeCompletion);