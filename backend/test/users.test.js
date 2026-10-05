import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import User from '../src/models/User.js';

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
});

const alice = { username: 'alice', email: 'alice@example.com', password: 'secret123' };
const unknownId = '507f1f77bcf86cd799439011';

describe('POST /api/users', () => {
  test('crée un utilisateur et ne renvoie pas le mot de passe', async () => {
    const response = await request(app).post('/api/users').send(alice);

    assert.equal(response.status, 201);
    assert.equal(response.body.user.username, 'alice');
    assert.equal(response.body.user.email, 'alice@example.com');
    assert.ok(response.body.user._id);
    assert.equal(response.body.user.password, undefined);
  });

  test('retourne 400 si un champ requis manque', async () => {
    const response = await request(app).post('/api/users').send({ username: 'alice' });

    assert.equal(response.status, 400);
  });

  test('retourne 409 si le username ou l\'email existe déjà', async () => {
    await User.create(alice);

    const response = await request(app).post('/api/users').send(alice);

    assert.equal(response.status, 409);
  });
});

describe('GET /api/users', () => {
  test('liste les utilisateurs sans mot de passe', async () => {
    await User.create(alice);
    await User.create({ username: 'bob', email: 'bob@example.com', password: 'secret456' });

    const response = await request(app).get('/api/users');

    assert.equal(response.status, 200);
    assert.equal(response.body.users.length, 2);
    for (const user of response.body.users) {
      assert.equal(user.password, undefined);
    }
  });
});

describe('GET /api/users/:id', () => {
  test('retourne l\'utilisateur', async () => {
    const user = await User.create(alice);

    const response = await request(app).get(`/api/users/${user._id}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.user.username, 'alice');
    assert.equal(response.body.user.password, undefined);
  });

  test('retourne 404 si l\'utilisateur n\'existe pas', async () => {
    const response = await request(app).get(`/api/users/${unknownId}`);

    assert.equal(response.status, 404);
  });

  test('retourne 400 si l\'id est invalide', async () => {
    const response = await request(app).get('/api/users/pas-un-id');

    assert.equal(response.status, 400);
  });
});

describe('PUT /api/users/:id', () => {
  test('met à jour uniquement les champs fournis', async () => {
    const user = await User.create(alice);

    const response = await request(app).put(`/api/users/${user._id}`).send({ username: 'alice2' });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.username, 'alice2');
    assert.equal(response.body.user.email, 'alice@example.com');
    assert.equal(response.body.user.password, undefined);
  });

  test('retourne 400 si les données sont invalides', async () => {
    const user = await User.create(alice);

    const response = await request(app).put(`/api/users/${user._id}`).send({ username: 'a'.repeat(31) });

    assert.equal(response.status, 400);
  });

  test('retourne 404 si l\'utilisateur n\'existe pas', async () => {
    const response = await request(app).put(`/api/users/${unknownId}`).send({ username: 'x' });

    assert.equal(response.status, 404);
  });
});

describe('DELETE /api/users/:id', () => {
  test('supprime l\'utilisateur', async () => {
    const user = await User.create(alice);

    const response = await request(app).delete(`/api/users/${user._id}`);

    assert.equal(response.status, 204);
    assert.equal(await User.findById(user._id), null);
  });

  test('retourne 404 si l\'utilisateur n\'existe pas', async () => {
    const response = await request(app).delete(`/api/users/${unknownId}`);

    assert.equal(response.status, 404);
  });
});
