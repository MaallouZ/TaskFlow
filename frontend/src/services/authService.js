import { request } from './api.js';

// inscription : { username, email, password }
export function register(user) {
  return request('/auth/register', { method: 'POST', body: user });
}

// connexion : renvoie le token
export async function login(username, password) {
  const data = await request('/auth/login', { method: 'POST', body: { username, password } });
  return data.token;
}
