import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import Habit from '../src/models/Habit.js';
import { Task } from '../src/models/Task.js';
import User from '../src/models/User.js';

config.jwtSecret ??= 'test-secret';

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await User.init();
});

after(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});
  await Habit.deleteMany({});
});

const alice = { username: 'alice', email: 'alice@example.com', password: 'secret123' };
const unknownId = '507f1f77bcf86cd799439011';

function makeUser(name, extra = {}) {
  return User.create({ username: name, email: `${name}@example.com`, password: 'secret123', ...extra });
}

function tokenFor(user, secret = config.jwtSecret, options = {}) {
  return jwt.sign({ _id: user._id.toString() }, secret, options);
}

function auth(user) {
  return { Authorization: `Bearer ${tokenFor(user)}` };
}

describe('POST /api/auth/register', () => {
  test('crée un compte et ne renvoie ni mot de passe ni jeton', async () => {
    const response = await request(app).post('/api/auth/register').send(alice);

    assert.equal(response.status, 201);
    assert.equal(response.body.username, 'alice');
    assert.equal(response.body.email, 'alice@example.com');
    assert.ok(response.body._id);
    assert.equal(response.body.password, undefined);
    assert.equal(response.body.token, undefined);
    assert.equal(await User.countDocuments(), 1);
  });

  test('stocke le mot de passe haché, jamais en clair', async () => {
    await request(app).post('/api/auth/register').send(alice);

    const stored = await User.findOne({ username: 'alice' });

    assert.notEqual(stored.password, 'secret123');
    assert.equal(await bcrypt.compare('secret123', stored.password), true);
  });

  test('retourne 400 si un champ obligatoire manque', async () => {
    const incomplete = [
      { email: alice.email, password: alice.password },
      { username: alice.username, password: alice.password },
      { username: alice.username, email: alice.email },
      {},
    ];

    for (const body of incomplete) {
      const response = await request(app).post('/api/auth/register').send(body);
      assert.equal(response.status, 400, JSON.stringify(body));
    }
    assert.equal(await User.countDocuments(), 0);
  });

  test('retourne 409 si le nom d\'utilisateur ou l\'email existe déjà', async () => {
    await request(app).post('/api/auth/register').send(alice);

    const sameUsername = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, email: 'autre@example.com' });
    const sameEmail = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, username: 'autre' });

    assert.equal(sameUsername.status, 409);
    assert.equal(sameEmail.status, 409);
    assert.equal(await User.countDocuments(), 1);
  });

  test('met le fuseau horaire à UTC quand il n\'est pas fourni', async () => {
    const response = await request(app).post('/api/auth/register').send(alice);

    assert.equal(response.status, 201);
    assert.equal(response.body.timezone, 'UTC');
    assert.equal((await User.findOne({ username: 'alice' })).timezone, 'UTC');
  });

  test('enregistre le fuseau horaire fourni', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, timezone: 'Europe/Paris' });

    assert.equal(response.status, 201);
    assert.equal((await User.findOne({ username: 'alice' })).timezone, 'Europe/Paris');
  });

  test('retourne 400 pour un fuseau horaire invalide, sans créer de compte', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, timezone: 'Paris' });

    assert.equal(response.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });
});

describe('POST /api/auth/login', () => {
  test('retourne un jeton valide 7 jours, qui contient l\'identifiant de l\'utilisateur', async () => {
    const registered = await request(app).post('/api/auth/register').send(alice);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'secret123' });

    assert.equal(response.status, 200);
    const payload = jwt.verify(response.body.token, config.jwtSecret);
    assert.equal(payload._id, registered.body._id);
    assert.equal(payload.exp - payload.iat, 7 * 24 * 3600);
  });

  test('retourne 401 avec un mauvais mot de passe ou un utilisateur inconnu, avec le même message', async () => {
    await request(app).post('/api/auth/register').send(alice);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'mauvais' });
    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ username: 'personne', password: 'secret123' });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownUser.status, 401);
    assert.equal(wrongPassword.body.message, unknownUser.body.message);
    assert.equal(wrongPassword.body.token, undefined);
  });

  test('retourne 400 si le nom d\'utilisateur ou le mot de passe manque', async () => {
    const noPassword = await request(app).post('/api/auth/login').send({ username: 'alice' });
    const noUsername = await request(app).post('/api/auth/login').send({ password: 'secret123' });

    assert.equal(noPassword.status, 400);
    assert.equal(noUsername.status, 400);
  });
});

describe('requireAuth : routes protégées', () => {
  const protectedRoutes = [
    ['get', '/api/tasks'],
    ['post', '/api/tasks'],
    ['get', '/api/tasks/search'],
    ['get', `/api/tasks/${unknownId}`],
    ['get', '/api/habits'],
    ['post', '/api/habits'],
    ['put', `/api/habits/${unknownId}/completions/2026-10-07`],
    ['delete', `/api/habits/${unknownId}/completions/2026-10-07`],
    ['get', '/api/stats/activity?from=2026-10-01&to=2026-10-02'],
    ['get', '/api/users/me'],
  ];

  test('refuse toutes les routes protégées sans jeton', async () => {
    for (const [method, path] of protectedRoutes) {
      const response = await request(app)[method](path);
      assert.equal(response.status, 401, `${method.toUpperCase()} ${path}`);
    }
  });

  test('refuse un en-tête Authorization mal formé', async () => {
    const headers = ['Basic abc123', 'Bearer', 'Bearer ', 'abc.def.ghi', 'Token abc.def.ghi'];

    for (const header of headers) {
      const response = await request(app).get('/api/tasks').set('Authorization', header);
      assert.equal(response.status, 401, JSON.stringify(header));
    }
  });

  test('refuse un jeton invalide, signé avec une autre clé ou expiré', async () => {
    const user = await makeUser('alice');
    const tokens = {
      invalide: 'abc.def.ghi',
      'autre clé': tokenFor(user, 'une-autre-cle-secrete'),
      expiré: tokenFor(user, config.jwtSecret, { expiresIn: -60 }),
    };

    for (const [label, token] of Object.entries(tokens)) {
      const response = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
      assert.equal(response.status, 401, label);
    }
  });

  test('accepte un jeton valide', async () => {
    const user = await makeUser('alice');

    const response = await request(app).get('/api/tasks').set(auth(user));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.tasks, []);
  });

  test('laisse publiques la santé de l\'API, l\'inscription et la connexion', async () => {
    const health = await request(app).get('/api/health');
    const register = await request(app).post('/api/auth/register').send({});
    const login = await request(app).post('/api/auth/login').send({});

    assert.equal(health.status, 200);
    assert.equal(register.status, 400);
    assert.equal(login.status, 400);
  });

  test('le jeton identifie l\'utilisateur : une tâche créée lui appartient', async () => {
    const user = await makeUser('alice');

    const response = await request(app).post('/api/tasks').set(auth(user)).send({ title: 'Ma tâche' });

    assert.equal(response.status, 201);
    assert.equal(response.body.task.ownerId, user._id.toString());
  });
});

describe('GET /api/users/me', () => {
  test('retourne l\'utilisateur connecté avec son fuseau, sans mot de passe', async () => {
    const user = await makeUser('alice');

    const response = await request(app).get('/api/users/me').set(auth(user));

    assert.equal(response.status, 200);
    assert.equal(response.body.user.username, 'alice');
    assert.equal(response.body.user.timezone, 'UTC');
    assert.equal(response.body.user.password, undefined);
  });
});

describe('PUT /api/users/:id : fuseau horaire', () => {
  test('modifie le fuseau horaire sans toucher au reste du profil', async () => {
    const user = await makeUser('alice');

    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .set(auth(user))
      .send({ timezone: 'Europe/Paris' });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.timezone, 'Europe/Paris');
    assert.equal(response.body.user.username, 'alice');
    assert.equal(response.body.user.password, undefined);
    assert.equal((await User.findById(user._id)).timezone, 'Europe/Paris');
  });

  test('retourne 400 pour un fuseau invalide et garde l\'ancien', async () => {
    const user = await makeUser('alice', { timezone: 'Europe/Paris' });

    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .set(auth(user))
      .send({ timezone: 'Paris' });

    assert.equal(response.status, 400);
    assert.equal((await User.findById(user._id)).timezone, 'Europe/Paris');
  });
});

describe('isolation des données entre utilisateurs', () => {
  test('GET /api/tasks ne liste que les tâches de l\'utilisateur connecté', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    await Task.create({ title: 'Tâche Alice', ownerId: alice._id });
    await Task.create({ title: 'Tâche Bob', ownerId: bob._id });

    const response = await request(app).get('/api/tasks').set(auth(alice));

    assert.equal(response.body.tasks.length, 1);
    assert.equal(response.body.tasks[0].title, 'Tâche Alice');
  });

  test('on ne peut ni lire, ni modifier, ni supprimer la tâche d\'un autre', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    const bobTask = await Task.create({ title: 'Secret de Bob', ownerId: bob._id });

    const read = await request(app).get(`/api/tasks/${bobTask._id}`).set(auth(alice));
    const update = await request(app)
      .patch(`/api/tasks/${bobTask._id}`)
      .set(auth(alice))
      .send({ title: 'Piratée' });
    const remove = await request(app).delete(`/api/tasks/${bobTask._id}`).set(auth(alice));

    assert.equal(read.status, 404);
    assert.equal(update.status, 404);
    assert.equal(remove.status, 404);
    assert.equal((await Task.findById(bobTask._id)).title, 'Secret de Bob');
  });

  test('POST /api/tasks ignore un ownerId envoyé dans le corps de la requête', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');

    const response = await request(app)
      .post('/api/tasks')
      .set(auth(alice))
      .send({ title: 'À moi', ownerId: bob._id.toString() });

    assert.equal(response.status, 201);
    assert.equal(response.body.task.ownerId, alice._id.toString());
  });

  test('on ne voit que ses propres habitudes et on ne peut pas ouvrir celles d\'un autre', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    await Habit.create({ userId: alice._id, name: 'Habitude Alice', frequency: 'daily' });
    const bobHabit = await Habit.create({ userId: bob._id, name: 'Habitude Bob', frequency: 'daily' });

    const list = await request(app).get('/api/habits').set(auth(alice));
    const read = await request(app).get(`/api/habits/${bobHabit._id}`).set(auth(alice));

    assert.equal(list.body.habits.length, 1);
    assert.equal(list.body.habits[0].name, 'Habitude Alice');
    assert.equal(read.status, 404);
  });
});
