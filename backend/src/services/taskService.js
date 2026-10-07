import mongoose from 'mongoose'
import { Task } from '../models/Task.js'

const PROTECTED_FIELDS = ['ownerId', 'completedAt'];

function withoutProtectedFields(data) {
    const clean = { ...data };
    for (const field of PROTECTED_FIELDS) delete clean[field];
    return clean;
}

export function listTasks(ownerId, { status } = {}) {
    const filter = { ownerId };
    if (status) filter.status = status;
    return Task.find(filter)
}

export async function createTask(ownerId, taskData) {
    const data = withoutProtectedFields(taskData);
    if (data.status === 'done') data.completedAt = new Date();
    const task = Task.create({ 
        ...data, ownerId 
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

export async function searchTasks(ownerId, { status, priority, deadline } = {}) {
    const filter = { ownerId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (deadline) filter.deadline = deadline;
    return Task.find(filter);
}

export async function updateTask(ownerId, taskId, taskData) {
    const changes = withoutProtectedFields(taskData);
    const current = await Task.findOne({ _id: taskId, ownerId });
    if (!current) return null;

    const update = { $set: changes };
    if (changes.status === 'done' && current.status !== 'done') {
        update.$set.completedAt = new Date();
    } else if (changes.status && current.status === 'done') {
        update.$unset = { completedAt: '' };
    }
    return Task.findOneAndUpdate(
        { _id: taskId, ownerId },
        update,
        { new: true, runValidators: true }
    );
}

export async function deleteTask(ownerId, taskId) {
    return Task.findOneAndDelete({
        _id: taskId,
        ownerId
    });
}