import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import Habit from '../src/models/Habit.js';
import User from '../src/models/User.js';
import {
  addCompletion,
  createHabit,
  removeCompletion,
  updateHabit,
} from '../src/services/habitService.js';
import { todayInTimeZone } from '../src/utils/dates.js';

config.jwtSecret ??= 'test-secret';

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await Habit.init();
  await User.init();
});

after(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  await Habit.deleteMany({});
  await User.deleteMany({});
});

const aliceId = new mongoose.Types.ObjectId();
const bobId = new mongoose.Types.ObjectId();
const unknownId = '507f1f77bcf86cd799439011';

function makeUser(name, extra = {}) {
  return User.create({ username: name, email: `${name}@example.com`, password: 'secret123', ...extra });
}

function auth(user) {
  return { Authorization: `Bearer ${jwt.sign({ _id: user._id.toString() }, config.jwtSecret)}` };
}

// lendemain d'une date AAAA-MM-JJ
function nextDay(date) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
}

describe('service : cocher et décocher un jour', () => {
  test('addCompletion ajoute le jour à l\'habitude', async () => {
    const habit = await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });

    const updated = await addCompletion(aliceId, habit._id, '2026-10-07');

    assert.deepEqual(updated.completedDates, ['2026-10-07']);
  });

  test('addCompletion ne crée pas de doublon quand on coche deux fois le même jour', async () => {
    const habit = await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });

    await addCompletion(aliceId, habit._id, '2026-10-07');
    const updated = await addCompletion(aliceId, habit._id, '2026-10-07');

    assert.deepEqual(updated.completedDates, ['2026-10-07']);
  });

  test('addCompletion garde les autres jours', async () => {
    const habit = await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });

    await addCompletion(aliceId, habit._id, '2026-10-05');
    const updated = await addCompletion(aliceId, habit._id, '2026-10-07');

    assert.deepEqual([...updated.completedDates].sort(), ['2026-10-05', '2026-10-07']);
  });

  test('addCompletion retourne null pour l\'habitude d\'un autre utilisateur ou inexistante', async () => {
    const bobHabit = await createHabit(bobId, { name: 'Privée', frequency: 'daily' });

    assert.equal(await addCompletion(aliceId, bobHabit._id, '2026-10-07'), null);
    assert.equal(await addCompletion(aliceId, unknownId, '2026-10-07'), null);
    assert.deepEqual((await Habit.findById(bobHabit._id)).completedDates, []);
  });

  test('removeCompletion retire uniquement le jour demandé', async () => {
    const habit = await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });
    await addCompletion(aliceId, habit._id, '2026-10-05');
    await addCompletion(aliceId, habit._id, '2026-10-07');

    const updated = await removeCompletion(aliceId, habit._id, '2026-10-05');

    assert.deepEqual(updated.completedDates, ['2026-10-07']);
  });

  test('removeCompletion ne fait rien si le jour n\'était pas coché', async () => {
    const habit = await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });
    await addCompletion(aliceId, habit._id, '2026-10-07');

    const updated = await removeCompletion(aliceId, habit._id, '2026-10-01');

    assert.deepEqual(updated.completedDates, ['2026-10-07']);
  });

  test('removeCompletion retourne null pour l\'habitude d\'un autre utilisateur', async () => {
    const bobHabit = await createHabit(bobId, { name: 'Privée', frequency: 'daily' });
    await addCompletion(bobId, bobHabit._id, '2026-10-07');

    assert.equal(await removeCompletion(aliceId, bobHabit._id, '2026-10-07'), null);
    assert.deepEqual((await Habit.findById(bobHabit._id)).completedDates, ['2026-10-07']);
  });
});

describe('service : completedDates ne s\'écrit pas directement', () => {
  test('createHabit ignore completedDates et userId envoyés par le client', async () => {
    const habit = await createHabit(aliceId, {
      name: 'Triche',
      frequency: 'daily',
      completedDates: ['2020-01-01'],
      userId: bobId,
    });

    assert.deepEqual(habit.completedDates, []);
    assert.equal(habit.userId.toString(), aliceId.toString());
  });

  test('updateHabit ignore completedDates et userId envoyés par le client', async () => {
    const habit = await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });
    await addCompletion(aliceId, habit._id, '2026-10-01');

    const updated = await updateHabit(aliceId, habit._id, {
      name: 'Lire 20 pages',
      completedDates: ['1999-01-01'],
      userId: bobId,
    });

    assert.equal(updated.name, 'Lire 20 pages');
    assert.deepEqual(updated.completedDates, ['2026-10-01']);
    assert.equal(updated.userId.toString(), aliceId.toString());
  });
});

describe('PUT /api/habits/:habitId/completions/:date', () => {
  test('retourne 401 sans jeton', async () => {
    const response = await request(app).put(`/api/habits/${unknownId}/completions/2026-10-07`);

    assert.equal(response.status, 401);
  });

  test('coche un jour passé et le renvoie dans l\'habitude', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });

    const response = await request(app)
      .put(`/api/habits/${habit._id}/completions/2026-10-07`)
      .set(auth(alice));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.habit.completedDates, ['2026-10-07']);
  });

  test('est idempotent : cocher deux fois ne crée qu\'une entrée', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });

    await request(app).put(`/api/habits/${habit._id}/completions/2026-10-07`).set(auth(alice));
    const response = await request(app).put(`/api/habits/${habit._id}/completions/2026-10-07`).set(auth(alice));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.habit.completedDates, ['2026-10-07']);
  });

  test('retourne 400 pour une date invalide', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });

    for (const date of ['2026-02-31', '2026-13-01', 'abc', '2026-1-5', '20261007']) {
      const response = await request(app).put(`/api/habits/${habit._id}/completions/${date}`).set(auth(alice));
      assert.equal(response.status, 400, date);
    }
    assert.deepEqual((await Habit.findById(habit._id)).completedDates, []);
  });

  test('retourne 400 pour un jour futur', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });

    const response = await request(app).put(`/api/habits/${habit._id}/completions/2099-01-01`).set(auth(alice));

    assert.equal(response.status, 400);
    assert.deepEqual((await Habit.findById(habit._id)).completedDates, []);
  });

  test('accepte aujourd\'hui et refuse demain, dans le fuseau de l\'utilisateur', async () => {
    for (const timezone of ['UTC', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
      const user = await makeUser(`user-${timezone.replace('/', '-')}`, { timezone });
      const habit = await createHabit(user._id, { name: 'Lire', frequency: 'daily' });
      const today = todayInTimeZone(timezone);

      const okResponse = await request(app).put(`/api/habits/${habit._id}/completions/${today}`).set(auth(user));
      const tooLate = await request(app).put(`/api/habits/${habit._id}/completions/${nextDay(today)}`).set(auth(user));

      assert.equal(okResponse.status, 200, `${timezone} : aujourd'hui (${today})`);
      assert.equal(tooLate.status, 400, `${timezone} : demain (${nextDay(today)})`);
    }
  });

  test('autorise les jours passés, même anciens', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });

    const response = await request(app).put(`/api/habits/${habit._id}/completions/2020-01-01`).set(auth(alice));

    assert.equal(response.status, 200);
  });

  test('retourne 404 pour l\'habitude d\'un autre utilisateur ou inexistante', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    const bobHabit = await createHabit(bob._id, { name: 'Privée', frequency: 'daily' });

    const other = await request(app).put(`/api/habits/${bobHabit._id}/completions/2026-10-07`).set(auth(alice));
    const missing = await request(app).put(`/api/habits/${unknownId}/completions/2026-10-07`).set(auth(alice));

    assert.equal(other.status, 404);
    assert.equal(missing.status, 404);
    assert.deepEqual((await Habit.findById(bobHabit._id)).completedDates, []);
  });
});

describe('DELETE /api/habits/:habitId/completions/:date', () => {
  test('retourne 401 sans jeton', async () => {
    const response = await request(app).delete(`/api/habits/${unknownId}/completions/2026-10-07`);

    assert.equal(response.status, 401);
  });

  test('décoche un jour et garde les autres', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });
    await addCompletion(alice._id, habit._id, '2026-10-05');
    await addCompletion(alice._id, habit._id, '2026-10-07');

    const response = await request(app)
      .delete(`/api/habits/${habit._id}/completions/2026-10-05`)
      .set(auth(alice));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.habit.completedDates, ['2026-10-07']);
  });

  test('retourne 400 pour une date invalide', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });

    const response = await request(app).delete(`/api/habits/${habit._id}/completions/2026-02-31`).set(auth(alice));

    assert.equal(response.status, 400);
  });

  test('retourne 404 pour l\'habitude d\'un autre utilisateur', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    const bobHabit = await createHabit(bob._id, { name: 'Privée', frequency: 'daily' });
    await addCompletion(bob._id, bobHabit._id, '2026-10-07');

    const response = await request(app)
      .delete(`/api/habits/${bobHabit._id}/completions/2026-10-07`)
      .set(auth(alice));

    assert.equal(response.status, 404);
    assert.deepEqual((await Habit.findById(bobHabit._id)).completedDates, ['2026-10-07']);
  });
});

describe('routes classiques des habitudes : completedDates reste protégé', () => {
  test('POST /api/habits ignore completedDates', async () => {
    const alice = await makeUser('alice');

    const response = await request(app)
      .post('/api/habits')
      .set(auth(alice))
      .send({ name: 'Triche', frequency: 'daily', completedDates: ['1999-01-01'] });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body.habit.completedDates, []);
  });

  test('PATCH /api/habits/:habitId ignore completedDates', async () => {
    const alice = await makeUser('alice');
    const habit = await createHabit(alice._id, { name: 'Lire', frequency: 'daily' });
    await addCompletion(alice._id, habit._id, '2026-10-07');

    const response = await request(app)
      .patch(`/api/habits/${habit._id}`)
      .set(auth(alice))
      .send({ name: 'Lire 20 pages', completedDates: ['1999-01-01'] });

    assert.equal(response.status, 200);
    assert.equal(response.body.habit.name, 'Lire 20 pages');
    assert.deepEqual(response.body.habit.completedDates, ['2026-10-07']);
  });
});
