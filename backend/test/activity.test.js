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
import { Task } from '../src/models/Task.js';
import User from '../src/models/User.js';
import { getActivity } from '../src/services/activityService.js';
import { listDays } from '../src/utils/dates.js';

config.jwtSecret ??= 'test-secret';

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await Task.init();
  await Habit.init();
  await User.init();
});

after(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
  await Habit.deleteMany({});
  await User.deleteMany({});
});

const aliceId = new mongoose.Types.ObjectId();
const bobId = new mongoose.Types.ObjectId();

// tâche terminée à un instant précis (on écrit directement en base)
function doneAt(ownerId, isoInstant) {
  return Task.create({ title: 'Tâche', status: 'done', ownerId, completedAt: new Date(isoInstant) });
}

function habitWith(userId, completedDates, name = 'Habitude') {
  return Habit.create({ userId, name, frequency: 'daily', completedDates });
}

// { '2026-10-07': 3 } : uniquement les jours qui ont de l'activité
function totals(result) {
  return Object.fromEntries(result.days.filter((day) => day.total > 0).map((day) => [day.date, day.total]));
}

function activity(userId, from, to, timeZone = 'Europe/Paris', source = 'all') {
  return getActivity(userId, { from, to, timeZone, source });
}

function makeUser(name, extra = {}) {
  return User.create({ username: name, email: `${name}@example.com`, password: 'secret123', ...extra });
}

function auth(user) {
  return { Authorization: `Bearer ${jwt.sign({ _id: user._id.toString() }, config.jwtSecret)}` };
}

describe('getActivity : structure et jours à zéro', () => {
  test('retourne tous les jours de la période, à zéro quand il n\'y a rien', async () => {
    const result = await activity(aliceId, '2026-10-01', '2026-10-10');

    assert.equal(result.days.length, 10);
    assert.deepEqual(result.days.map((day) => day.date), listDays('2026-10-01', '2026-10-10'));
    for (const day of result.days) {
      assert.deepEqual({ tasks: day.tasks, habits: day.habits, total: day.total }, { tasks: 0, habits: 0, total: 0 });
    }
    assert.equal(result.max, 0);
  });

  test('rappelle la période et le fuseau utilisés', async () => {
    const result = await activity(aliceId, '2026-10-01', '2026-10-10', 'Asia/Tokyo');

    assert.equal(result.from, '2026-10-01');
    assert.equal(result.to, '2026-10-10');
    assert.equal(result.timezone, 'Asia/Tokyo');
  });

  test('accepte une période d\'un seul jour', async () => {
    await doneAt(aliceId, '2026-10-07T10:00:00.000Z');

    const result = await activity(aliceId, '2026-10-07', '2026-10-07');

    assert.equal(result.days.length, 1);
    assert.equal(result.days[0].total, 1);
  });

  test('garde des jours consécutifs, sans trou ni doublon, à travers un changement d\'heure', async () => {
    const result = await activity(aliceId, '2026-10-20', '2026-11-05');

    assert.deepEqual(result.days.map((day) => day.date), listDays('2026-10-20', '2026-11-05'));
  });
});

describe('getActivity : tâches terminées', () => {
  test('compte les tâches terminées jour par jour', async () => {
    await doneAt(aliceId, '2026-10-05T10:00:00.000Z');
    await doneAt(aliceId, '2026-10-05T15:00:00.000Z');
    await doneAt(aliceId, '2026-10-07T10:00:00.000Z');

    const result = await activity(aliceId, '2026-10-01', '2026-10-10');

    assert.deepEqual(totals(result), { '2026-10-05': 2, '2026-10-07': 1 });
    assert.equal(result.days.find((day) => day.date === '2026-10-05').tasks, 2);
    assert.equal(result.days.find((day) => day.date === '2026-10-05').habits, 0);
    assert.equal(result.max, 2);
  });

  test('le même instant tombe sur des jours différents selon le fuseau', async () => {
    await doneAt(aliceId, '2026-10-07T22:30:00.000Z');

    const expectedDays = [
      ['UTC', '2026-10-07'],
      ['America/Los_Angeles', '2026-10-07'],
      ['Pacific/Pago_Pago', '2026-10-07'],
      ['Europe/Paris', '2026-10-08'],
      ['Pacific/Auckland', '2026-10-08'],
      ['Pacific/Kiritimati', '2026-10-08'],
    ];
    for (const [timeZone, day] of expectedDays) {
      const result = await activity(aliceId, '2026-10-06', '2026-10-09', timeZone);
      assert.deepEqual(totals(result), { [day]: 1 }, timeZone);
    }
  });

  test('bascule à minuit pile, heure de Paris', async () => {
    await doneAt(aliceId, '2026-10-07T21:59:59.999Z'); // 23:59:59 le 7
    await doneAt(aliceId, '2026-10-07T22:00:00.000Z'); // 00:00:00 le 8

    const result = await activity(aliceId, '2026-10-06', '2026-10-09', 'Europe/Paris');

    assert.deepEqual(totals(result), { '2026-10-07': 1, '2026-10-08': 1 });
  });

  test('range bien les tâches autour du changement d\'heure d\'automne (25 octobre 2026)', async () => {
    await doneAt(aliceId, '2026-10-24T21:59:59.000Z'); // 23:59:59 le 24 (heure d'été)
    await doneAt(aliceId, '2026-10-24T22:00:00.000Z'); // 00:00:00 le 25
    await doneAt(aliceId, '2026-10-25T22:59:59.000Z'); // 23:59:59 le 25 (heure d'hiver, journée de 25 h)
    await doneAt(aliceId, '2026-10-25T23:00:00.000Z'); // 00:00:00 le 26

    const result = await activity(aliceId, '2026-10-23', '2026-10-27', 'Europe/Paris');

    assert.deepEqual(totals(result), { '2026-10-24': 1, '2026-10-25': 2, '2026-10-26': 1 });
    assert.equal(result.days.length, 5);
  });

  test('range bien les tâches autour du changement d\'heure de printemps (29 mars 2026)', async () => {
    await doneAt(aliceId, '2026-03-28T22:59:59.000Z'); // 23:59:59 le 28 (heure d'hiver)
    await doneAt(aliceId, '2026-03-28T23:00:00.000Z'); // 00:00:00 le 29
    await doneAt(aliceId, '2026-03-29T21:59:59.000Z'); // 23:59:59 le 29 (heure d'été, journée de 23 h)
    await doneAt(aliceId, '2026-03-29T22:00:00.000Z'); // 00:00:00 le 30

    const result = await activity(aliceId, '2026-03-27', '2026-03-31', 'Europe/Paris');

    assert.deepEqual(totals(result), { '2026-03-28': 1, '2026-03-29': 2, '2026-03-30': 1 });
  });

  test('inclut les tâches aux extrémités de la période, même avec des fuseaux extrêmes', async () => {
    // Pacific/Kiritimati = UTC+14 : le 7 octobre local commence le 6 à 10:00 UTC
    await doneAt(aliceId, '2026-10-06T10:30:00.000Z'); // 00:30 le 7 -> dedans
    await doneAt(aliceId, '2026-10-06T09:30:00.000Z'); // 23:30 le 6 -> dehors

    const kiritimati = await activity(aliceId, '2026-10-07', '2026-10-07', 'Pacific/Kiritimati');
    assert.deepEqual(totals(kiritimati), { '2026-10-07': 1 });

    await Task.deleteMany({});

    // Pacific/Pago_Pago = UTC-11 : le 7 octobre local finit le 8 à 11:00 UTC
    await doneAt(aliceId, '2026-10-08T10:30:00.000Z'); // 23:30 le 7 -> dedans
    await doneAt(aliceId, '2026-10-08T11:30:00.000Z'); // 00:30 le 8 -> dehors

    const pagoPago = await activity(aliceId, '2026-10-07', '2026-10-07', 'Pacific/Pago_Pago');
    assert.deepEqual(totals(pagoPago), { '2026-10-07': 1 });
  });

  test('ignore les tâches hors de la période demandée', async () => {
    await doneAt(aliceId, '2026-10-04T21:59:59.000Z'); // 23:59:59 le 4 -> dehors
    await doneAt(aliceId, '2026-10-04T22:00:00.000Z'); // 00:00:00 le 5 -> dedans
    await doneAt(aliceId, '2026-10-07T21:59:59.000Z'); // 23:59:59 le 7 -> dedans
    await doneAt(aliceId, '2026-10-07T22:00:00.000Z'); // 00:00:00 le 8 -> dehors

    const result = await activity(aliceId, '2026-10-05', '2026-10-07', 'Europe/Paris');

    assert.deepEqual(totals(result), { '2026-10-05': 1, '2026-10-07': 1 });
  });

  test('ne compte que les tâches terminées avec une date de complétion', async () => {
    await Task.create({ title: 'À faire', status: 'todo', ownerId: aliceId });
    await Task.create({ title: 'En cours', status: 'doing', ownerId: aliceId });
    await Task.create({
      title: 'Incohérente',
      status: 'doing',
      ownerId: aliceId,
      completedAt: new Date('2026-10-07T10:00:00.000Z'),
    });
    await Task.create({ title: 'Ancienne, sans date', status: 'done', ownerId: aliceId });

    const result = await activity(aliceId, '2026-10-01', '2026-10-10');

    assert.deepEqual(totals(result), {});
  });

  test('ne compte pas les tâches des autres utilisateurs', async () => {
    await doneAt(aliceId, '2026-10-07T10:00:00.000Z');
    await doneAt(bobId, '2026-10-07T10:00:00.000Z');
    await doneAt(bobId, '2026-10-07T11:00:00.000Z');

    const result = await activity(aliceId, '2026-10-01', '2026-10-10');

    assert.deepEqual(totals(result), { '2026-10-07': 1 });
  });

  test('accepte un identifiant en texte, comme celui qui vient du jeton', async () => {
    await doneAt(aliceId, '2026-10-07T10:00:00.000Z');
    await habitWith(aliceId, ['2026-10-07']);

    const result = await activity(aliceId.toString(), '2026-10-01', '2026-10-10');

    assert.deepEqual(totals(result), { '2026-10-07': 2 });
  });
});

describe('getActivity : habitudes', () => {
  test('compte les jours cochés, toutes habitudes confondues', async () => {
    await habitWith(aliceId, ['2026-10-05', '2026-10-07'], 'Lire');
    await habitWith(aliceId, ['2026-10-07'], 'Sport');

    const result = await activity(aliceId, '2026-10-01', '2026-10-10');

    assert.deepEqual(totals(result), { '2026-10-05': 1, '2026-10-07': 2 });
    const day = result.days.find((item) => item.date === '2026-10-07');
    assert.deepEqual({ tasks: day.tasks, habits: day.habits }, { tasks: 0, habits: 2 });
  });

  test('ignore les jours cochés hors de la période', async () => {
    await habitWith(aliceId, ['2026-09-30', '2026-10-01', '2026-10-10', '2026-10-11']);

    const result = await activity(aliceId, '2026-10-01', '2026-10-10');

    assert.deepEqual(totals(result), { '2026-10-01': 1, '2026-10-10': 1 });
  });

  test('ne dépend pas du fuseau : un jour coché reste ce jour-là', async () => {
    await habitWith(aliceId, ['2026-10-07']);

    for (const timeZone of ['UTC', 'Europe/Paris', 'Pacific/Auckland', 'Pacific/Pago_Pago']) {
      const result = await activity(aliceId, '2026-10-06', '2026-10-08', timeZone);
      assert.deepEqual(totals(result), { '2026-10-07': 1 }, timeZone);
    }
  });

  test('ne compte pas les habitudes des autres utilisateurs', async () => {
    await habitWith(aliceId, ['2026-10-07']);
    await habitWith(bobId, ['2026-10-07', '2026-10-08']);

    const result = await activity(aliceId, '2026-10-01', '2026-10-10');

    assert.deepEqual(totals(result), { '2026-10-07': 1 });
  });
});

describe('getActivity : tâches et habitudes ensemble', () => {
  async function seedBoth() {
    await doneAt(aliceId, '2026-10-07T10:00:00.000Z');
    await doneAt(aliceId, '2026-10-07T12:00:00.000Z');
    await habitWith(aliceId, ['2026-10-06', '2026-10-07'], 'Lire');
    await habitWith(aliceId, ['2026-10-07'], 'Sport');
  }

  test('additionne les deux sources et garde le détail', async () => {
    await seedBoth();

    const result = await activity(aliceId, '2026-10-05', '2026-10-08');

    const day6 = result.days.find((day) => day.date === '2026-10-06');
    const day7 = result.days.find((day) => day.date === '2026-10-07');
    assert.deepEqual({ tasks: day6.tasks, habits: day6.habits, total: day6.total }, { tasks: 0, habits: 1, total: 1 });
    assert.deepEqual({ tasks: day7.tasks, habits: day7.habits, total: day7.total }, { tasks: 2, habits: 2, total: 4 });
    assert.equal(result.max, 4);
  });

  test('source = tasks ne compte que les tâches', async () => {
    await seedBoth();

    const result = await activity(aliceId, '2026-10-05', '2026-10-08', 'Europe/Paris', 'tasks');

    assert.deepEqual(totals(result), { '2026-10-07': 2 });
    assert.ok(result.days.every((day) => day.habits === 0));
    assert.equal(result.max, 2);
  });

  test('source = habits ne compte que les habitudes', async () => {
    await seedBoth();

    const result = await activity(aliceId, '2026-10-05', '2026-10-08', 'Europe/Paris', 'habits');

    assert.deepEqual(totals(result), { '2026-10-06': 1, '2026-10-07': 2 });
    assert.ok(result.days.every((day) => day.tasks === 0));
  });
});

describe('GET /api/stats/activity', () => {
  const url = (query) => `/api/stats/activity?${query}`;

  test('retourne 401 sans jeton', async () => {
    const response = await request(app).get(url('from=2026-10-01&to=2026-10-07'));

    assert.equal(response.status, 401);
  });

  test('retourne 400 si les paramètres sont absents ou invalides', async () => {
    const alice = await makeUser('alice');
    const invalidQueries = [
      '',
      'from=2026-10-01',
      'to=2026-10-07',
      'from=2026-02-31&to=2026-10-07',
      'from=abc&to=2026-10-07',
      'from=2026-10-10&to=2026-10-01',
      'from=2025-10-06&to=2026-10-07', // 367 jours
      'from=2026-10-01&to=2026-10-07&source=nimporte',
      'from=2026-10-01&to=2026-10-07&tz=Paris',
      'from=2026-10-01&to=2026-10-07&tz=',
    ];

    for (const query of invalidQueries) {
      const response = await request(app).get(url(query)).set(auth(alice));
      assert.equal(response.status, 400, query);
      assert.ok(response.body.message, query);
    }
  });

  test('accepte une période de 366 jours, pas plus', async () => {
    const alice = await makeUser('alice');

    const response = await request(app).get(url('from=2025-10-07&to=2026-10-07')).set(auth(alice));

    assert.equal(response.status, 200);
    assert.equal(response.body.days.length, 366);
  });

  test('renvoie la structure attendue, un élément par jour', async () => {
    const alice = await makeUser('alice');
    await doneAt(alice._id, '2026-10-07T10:00:00.000Z');

    const response = await request(app).get(url('from=2026-10-01&to=2026-10-31')).set(auth(alice));

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body).sort(), ['days', 'from', 'max', 'timezone', 'to']);
    assert.equal(response.body.days.length, 31);
    assert.deepEqual(Object.keys(response.body.days[0]).sort(), ['date', 'habits', 'tasks', 'total']);
    assert.equal(response.body.max, 1);
  });

  test('utilise le fuseau du profil par défaut, et tz le remplace', async () => {
    const alice = await makeUser('alice', { timezone: 'Pacific/Auckland' });
    await doneAt(alice._id, '2026-10-07T12:00:00.000Z'); // 01:00 le 8 à Auckland (UTC+13)

    const byDefault = await request(app).get(url('from=2026-10-06&to=2026-10-09')).set(auth(alice));
    const withUtc = await request(app).get(url('from=2026-10-06&to=2026-10-09&tz=UTC')).set(auth(alice));

    assert.equal(byDefault.body.timezone, 'Pacific/Auckland');
    assert.deepEqual(totals(byDefault.body), { '2026-10-08': 1 });
    assert.equal(withUtc.body.timezone, 'UTC');
    assert.deepEqual(totals(withUtc.body), { '2026-10-07': 1 });
  });

  test('filtre par source', async () => {
    const alice = await makeUser('alice');
    await doneAt(alice._id, '2026-10-07T10:00:00.000Z');
    await habitWith(alice._id, ['2026-10-07']);

    const all = await request(app).get(url('from=2026-10-06&to=2026-10-08')).set(auth(alice));
    const tasks = await request(app).get(url('from=2026-10-06&to=2026-10-08&source=tasks')).set(auth(alice));
    const habits = await request(app).get(url('from=2026-10-06&to=2026-10-08&source=habits')).set(auth(alice));

    assert.deepEqual(totals(all.body), { '2026-10-07': 2 });
    assert.deepEqual(totals(tasks.body), { '2026-10-07': 1 });
    assert.deepEqual(totals(habits.body), { '2026-10-07': 1 });
  });

  test('ne montre que l\'activité de l\'utilisateur connecté', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    await doneAt(alice._id, '2026-10-07T10:00:00.000Z');
    await doneAt(bob._id, '2026-10-07T10:00:00.000Z');
    await habitWith(bob._id, ['2026-10-07', '2026-10-08']);

    const response = await request(app).get(url('from=2026-10-06&to=2026-10-09')).set(auth(alice));

    assert.deepEqual(totals(response.body), { '2026-10-07': 1 });
  });
});
