// base de tous les appels au backend
const BASE_URL = '/api';
const TOKEN_KEY = 'taskflow_token';

// token gardé dans le localStorage
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  // on envoie le token si on est connecté
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Impossible de joindre le serveur.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 401 hors login = token expiré -> retour à la connexion
    if (response.status === 401 && !path.startsWith('/auth/')) {
      clearToken();
      window.location.href = '/login';
    }
    const message =
      data?.message ??
      (typeof data?.error === 'string' ? data.error : data?.error?.message) ??
      `Erreur ${response.status}`;
    throw new Error(message);
  }
  return data;
}
