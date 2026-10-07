import { request } from './api.js';

export async function getHabits() {
  const data = await request('/habits');
  return data.habits;
}

export async function getHabit(id) {
  const data = await request(`/habits/${id}`);
  return data.habit;
}

export async function createHabit(habit) {
  const data = await request('/habits', { method: 'POST', body: habit });
  return data.habit;
}

export async function updateHabit(id, changes) {
  const data = await request(`/habits/${id}`, { method: 'PATCH', body: changes });
  return data.habit;
}

export async function deleteHabit(id) {
  await request(`/habits/${id}`, { method: 'DELETE' });
}

// cocher un jour (date = AAAA-MM-JJ)
export async function checkHabit(id, date) {
  const data = await request(`/habits/${id}/completions/${date}`, { method: 'PUT' });
  return data.habit;
}

// décocher un jour
export async function uncheckHabit(id, date) {
  const data = await request(`/habits/${id}/completions/${date}`, { method: 'DELETE' });
  return data.habit;
}
