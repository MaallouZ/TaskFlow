import { Router } from 'express';
import * as activityController from '../controllers/activityController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get('/activity', activityController.getActivity);