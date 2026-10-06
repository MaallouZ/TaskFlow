// tous les appels au backend

const BASE_URL = '/api';


async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Impossible de joindre le serveur.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? `Erreur ${response.status}`);
  }
  return data;
}



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


export async function getUsers() {
  const data = await request('/users');      
  return data.users;
}

export async function getUser(id) {
  const data = await request(`/users/${id}`); 
  return data.user;
}

export async function createUser(user) {
  const data = await request('/users', { method: 'POST', body: user });
  return data.user;
}

export async function updateUser(id, changes) {
  const data = await request(`/users/${id}`, { method: 'PUT', body: changes });
  return data.user;
}

export async function deleteUser(id) {
  await request(`/users/${id}`, { method: 'DELETE' });
}
