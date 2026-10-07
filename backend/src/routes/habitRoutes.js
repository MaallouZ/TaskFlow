import { Router } from 'express';
import * as habitController from '../controllers/habitController.js';

export const habitRouter = Router();

habitRouter.post('/', habitController.createHabit);
habitRouter.get('/', habitController.getAllHabits);
habitRouter.get('/:habitId', habitController.getHabitById);
habitRouter.patch('/:habitId', habitController.updateHabit);
habitRouter.delete('/:habitId', habitController.deleteHabit);