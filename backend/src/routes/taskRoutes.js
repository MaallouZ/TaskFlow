import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';

export const taskRouter = Router();

taskRouter.post('/', taskController.createTask);
taskRouter.get('/', taskController.getAllTasks);
taskRouter.get('/:taskId', taskController.getTaskById);
taskRouter.patch('/:taskId', taskController.updateTask);
taskRouter.delete('/:taskId', taskController.deleteTask);