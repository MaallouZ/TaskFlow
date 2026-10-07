import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export const taskRouter = Router();
taskRouter.use(requireAuth);

taskRouter.post('/', taskController.createTask);
taskRouter.get('/', taskController.getAllTasks);
taskRouter.get('/search', taskController.searchTasks);
taskRouter.get('/:taskId', taskController.getTaskById);
taskRouter.patch('/:taskId', taskController.updateTask);
taskRouter.delete('/:taskId', taskController.deleteTask);