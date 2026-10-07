import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { Task } from '../src/models/Task.js';
import { createTask, updateTask } from '../src/services/taskService.js';

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await Task.init();
});

after(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

const aliceId = new mongoose.Types.ObjectId();
const bobId = new mongoose.Types.ObjectId();
const OLD_DATE = new Date('2026-01-15T10:00:00.000Z');

// crée directement en base une tâche avec une date de complétion connue
function seedTask(status, completedAt, ownerId = aliceId) {
  return Task.create({ title: 'Tâche', status, ownerId, completedAt });
}

// vérifie qu'une date a été posée "maintenant" (entre deux repères)
function assertJustNow(date, before, after) {
  assert.ok(date instanceof Date, 'completedAt doit être une date');
  assert.ok(date.getTime() >= before && date.getTime() <= after, `date inattendue : ${date.toISOString()}`);
}

describe('createTask : date de complétion', () => {
  test('ne pose pas de date pour une tâche à faire ou en cours', async () => {
    const todo = await createTask(aliceId, { title: 'À faire' });
    const doing = await createTask(aliceId, { title: 'En cours', status: 'doing' });

    assert.equal(todo.completedAt, undefined);
    assert.equal(doing.completedAt, undefined);
  });

  test('pose la date du moment quand la tâche est créée directement terminée', async () => {
    const before = Date.now();
    const task = await createTask(aliceId, { title: 'Déjà faite', status: 'done' });
    const after = Date.now();

    assertJustNow(task.completedAt, before, after);
  });

  test('ignore une date de complétion envoyée par le client', async () => {
    const todo = await createTask(aliceId, { title: 'Triche 1', completedAt: OLD_DATE });
    assert.equal(todo.completedAt, undefined);

    const before = Date.now();
    const done = await createTask(aliceId, { title: 'Triche 2', status: 'done', completedAt: OLD_DATE });
    const after = Date.now();
    assertJustNow(done.completedAt, before, after);
  });
});

describe('updateTask : date de complétion', () => {
  test('pose la date quand la tâche passe à terminée', async () => {
    for (const status of ['todo', 'doing']) {
      const task = await seedTask(status);

      const before = Date.now();
      const updated = await updateTask(aliceId, task._id, { status: 'done' });
      const after = Date.now();

      assertJustNow(updated.completedAt, before, after);
    }
  });

  test('conserve la date quand on modifie une tâche déjà terminée', async () => {
    const task = await seedTask('done', OLD_DATE);

    const updated = await updateTask(aliceId, task._id, { title: 'Nouveau titre' });

    assert.equal(updated.title, 'Nouveau titre');
    assert.equal(updated.completedAt.toISOString(), OLD_DATE.toISOString());
  });

  test('conserve la date quand le formulaire renvoie le statut "terminé" avec les autres champs', async () => {
    const task = await seedTask('done', OLD_DATE);

    const updated = await updateTask(aliceId, task._id, { title: 'Nouveau titre', status: 'done' });

    assert.equal(updated.completedAt.toISOString(), OLD_DATE.toISOString());
  });

  test('retire la date quand la tâche quitte le statut terminé', async () => {
    for (const status of ['todo', 'doing']) {
      const task = await seedTask('done', OLD_DATE);

      const updated = await updateTask(aliceId, task._id, { status });
      const stored = await Task.findById(task._id);

      assert.equal(updated.completedAt, undefined);
      assert.equal(stored.completedAt, undefined);
      assert.equal('completedAt' in stored.toObject(), false);
    }
  });

  test('donne une nouvelle date quand on rouvre puis qu\'on re-termine une tâche', async () => {
    const task = await seedTask('done', OLD_DATE);
    await updateTask(aliceId, task._id, { status: 'todo' });

    const before = Date.now();
    const updated = await updateTask(aliceId, task._id, { status: 'done' });
    const after = Date.now();

    assertJustNow(updated.completedAt, before, after);
  });

  test('ignore une date de complétion envoyée par le client', async () => {
    const todo = await seedTask('todo');
    const updatedTodo = await updateTask(aliceId, todo._id, { title: 'Triche', completedAt: OLD_DATE });
    assert.equal(updatedTodo.completedAt, undefined);

    const done = await seedTask('done', OLD_DATE);
    const newDate = new Date('2030-01-01T00:00:00.000Z');
    const updatedDone = await updateTask(aliceId, done._id, { title: 'Triche', completedAt: newDate });
    assert.equal(updatedDone.completedAt.toISOString(), OLD_DATE.toISOString());

    const other = await seedTask('todo');
    const before = Date.now();
    const completed = await updateTask(aliceId, other._id, { status: 'done', completedAt: OLD_DATE });
    const after = Date.now();
    assertJustNow(completed.completedAt, before, after);
  });

  test('ignore un ownerId envoyé dans les modifications', async () => {
    const task = await seedTask('todo');

    await updateTask(aliceId, task._id, { title: 'Volée ?', ownerId: bobId });

    const stored = await Task.findById(task._id);
    assert.equal(stored.ownerId.toString(), aliceId.toString());
    assert.equal(stored.title, 'Volée ?');
  });

  test('ne touche pas à la date quand la mise à jour est refusée (statut invalide)', async () => {
    const task = await seedTask('done', OLD_DATE);

    await assert.rejects(updateTask(aliceId, task._id, { status: 'later' }), mongoose.Error.ValidationError);

    const stored = await Task.findById(task._id);
    assert.equal(stored.status, 'done');
    assert.equal(stored.completedAt.toISOString(), OLD_DATE.toISOString());
  });

  test('ne modifie pas la date d\'une tâche appartenant à un autre propriétaire', async () => {
    const task = await seedTask('done', OLD_DATE, bobId);

    const updated = await updateTask(aliceId, task._id, { status: 'todo' });

    assert.equal(updated, null);
    const stored = await Task.findById(task._id);
    assert.equal(stored.status, 'done');
    assert.equal(stored.completedAt.toISOString(), OLD_DATE.toISOString());
  });
});
