import mongoose from 'mongoose'
import { Task } from '../models/Task.js'

export function listTasks(ownerId, { status } = {}) {
    const filter = { ownerId };
    if (status) filter.status = status;
    return Task.find(filter)
}

export async function createTask(ownerId, taskData) {
    const task = Task.create({ 
        ...taskData, ownerId 
    });
    return task;
}

export async function getOneTask(ownerId, taskId) {
    const filter = {
        ownerId,
        _id: taskId
    }
    return Task.findOne(filter)
}

export async function updateTask(ownerId, taskId, taskData) {
    return Task.findOneAndUpdate(
        {
            _id: taskId,
            ownerId
        },
        {
            $set: taskData
        },
        {
            new:true,
            runValidators:true
        }
    );
}

export async function deleteTask(ownerId, taskId) {
    return Task.findOneAndDelete({
        _id: taskId,
        ownerId
    });
}