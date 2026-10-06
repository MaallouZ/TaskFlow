import { request } from './api.js';

export async function getTasks() {
  const data = await request('/tasks');
  return data.tasks;
}

export async function getTask(id) {
  const data = await request(`/tasks/${id}`);
  return data.task;
}

export async function createTask(task) {
  const data = await request('/tasks', { method: 'POST', body: task });
  return data.task;
}

export async function updateTask(id, changes) {
  const data = await request(`/tasks/${id}`, { method: 'PATCH', body: changes });
  return data.task;
}

export async function deleteTask(id) {
  await request(`/tasks/${id}`, { method: 'DELETE' });
}
