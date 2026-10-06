import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import {requireAuth} from '../middlewares/requireAuth.js';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get('/me', userController.getCurrentUser);
userRouter.get('/', userController.getAllUsers);
userRouter.get('/:id', userController.getUser);
userRouter.post('/', userController.createUser);
userRouter.put('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
