import { request } from './api.js';

// utilisateur connecté
export async function getMe() {
  const data = await request('/users/me');
  return data.user;
}

// mon compte (toujours avec l'id de l'utilisateur connecté)
export async function updateUser(id, changes) {
  const data = await request(`/users/${id}`, { method: 'PUT', body: changes });
  return data.user;
}

export async function deleteUser(id) {
  await request(`/users/${id}`, { method: 'DELETE' });
}
