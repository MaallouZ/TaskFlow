import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, disconnectDb } from '../src/config/db.js';
import Habit from '../src/models/Habit.js';
import {
  createHabit,
  deleteHabit,
  getAllHabits,
  getHabitById,
  updateHabit,
} from '../src/services/habitService.js';

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await Habit.init();
});

after(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  await Habit.deleteMany({});
});

const aliceId = new mongoose.Types.ObjectId();
const bobId = new mongoose.Types.ObjectId();
const unknownId = '507f1f77bcf86cd799439011';

describe('createHabit', () => {
  test('cree une habitude avec ses valeurs', async () => {
    const habit = await createHabit(aliceId, {
      name: 'Lire',
      description: 'Lire quelques pages',
      frequency: 'daily',
      targetPerPeriod: 1,
    });

    assert.ok(habit._id);
    assert.equal(habit.name, 'Lire');
    assert.equal(habit.userId.toString(), aliceId.toString());
    assert.deepEqual(habit.completedDates, []);
  });

  test('rejette une habitude invalide', async () => {
    await assert.rejects(
      createHabit(aliceId, { name: 'Habitude sans frequence' }),
      mongoose.Error.ValidationError
    );
  });
});

describe('getAllHabits', () => {
  test('retourne uniquement les habitudes de utilisateur', async () => {
    await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });
    await createHabit(aliceId, { name: 'Marcher', frequency: 'weekly' });
    await createHabit(bobId, { name: 'Coder', frequency: 'daily' });

    const habits = await getAllHabits(aliceId);

    assert.equal(habits.length, 2);
    for (const habit of habits) {
      assert.equal(habit.userId.toString(), aliceId.toString());
    }
  });
});

describe('getHabitById', () => {
  test('retourne une habitude appartenant a utilisateur', async () => {
    const created = await createHabit(aliceId, { name: 'Lire', frequency: 'daily' });

    const habit = await getHabitById(aliceId, created._id);

    assert.equal(habit.name, 'Lire');
  });

  test('retourne null pour une habitude appartenant a un autre utilisateur', async () => {
    const created = await createHabit(bobId, { name: 'Privee', frequency: 'daily' });

    assert.equal(await getHabitById(aliceId, created._id), null);
  });

  test('retourne null si habitude inexistante', async () => {
    assert.equal(await getHabitById(aliceId, unknownId), null);
  });
});

describe('updateHabit', () => {
  test('met a jour les champs fournis et valide les donnees', async () => {
    const created = await createHabit(aliceId, {
      name: 'Lire',
      frequency: 'daily',
    });

    const habit = await updateHabit(aliceId, created._id, {
      name: 'Lire 20 pages',
      targetPerPeriod: 2,
    });

    assert.equal(habit.name, 'Lire 20 pages');
    assert.equal(habit.targetPerPeriod, 2);
    assert.equal(habit.frequency, 'daily');
  });

  test('ne modifie pas une habitude appartenant a un autre utilisateur', async () => {
    const created = await createHabit(bobId, { name: 'Privee', frequency: 'daily' });

    assert.equal(await updateHabit(aliceId, created._id, { name: 'Modifiee' }), null);
    assert.equal((await Habit.findById(created._id)).name, 'Privee');
  });
});

describe('deleteHabit', () => {
  test('supprime une habitude appartenant a utilisateur', async () => {
    const created = await createHabit(aliceId, { name: 'A supprimer', frequency: 'daily' });

    const habit = await deleteHabit(aliceId, created._id);

    assert.equal(habit.name, 'A supprimer');
    assert.equal(await Habit.findById(created._id), null);
  });

  test('ne supprime pas une habitude appartenant a un autre utilisateur', async () => {
    const created = await createHabit(bobId, { name: 'Privee', frequency: 'daily' });

    assert.equal(await deleteHabit(aliceId, created._id), null);
    assert.ok(await Habit.findById(created._id));
  });
});