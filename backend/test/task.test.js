import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { Task } from '../src/models/Task.js';
import {
  createTask,
  deleteTask,
  getOneTask,
  listTasks,
  updateTask,
} from '../src/services/taskService.js';

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
const unknownId = '507f1f77bcf86cd799439011';

describe('createTask', () => {
  test('crée une tâche avec les valeurs par défaut', async () => {
    const task = await createTask(aliceId, { title: '  Faire les courses  ' });

    assert.ok(task._id);
    assert.equal(task.title, 'Faire les courses');
    assert.equal(task.status, 'todo');
    assert.equal(task.ownerId.toString(), aliceId.toString());
    assert.ok(task.createdAt);
    assert.ok(task.updatedAt);
  });

  test('enregistre la description, le statut et la deadline', async () => {
    const deadline = new Date('2026-12-31T00:00:00.000Z');

    const task = await createTask(aliceId, {
      title: 'Préparer la démo',
      description: 'Slides + vidéo',
      status: 'doing',
      deadline,
    });

    assert.equal(task.description, 'Slides + vidéo');
    assert.equal(task.status, 'doing');
    assert.equal(task.deadline.toISOString(), deadline.toISOString());
  });

  test('force le ownerId même si un autre est fourni dans les données', async () => {
    const task = await createTask(aliceId, { title: 'À moi', ownerId: bobId });

    assert.equal(task.ownerId.toString(), aliceId.toString());
  });

  test('rejette une tâche sans titre', async () => {
    await assert.rejects(
      createTask(aliceId, { description: 'Pas de titre' }),
      mongoose.Error.ValidationError
    );
  });

  test('rejette un titre de plus de 120 caractères', async () => {
    await assert.rejects(
      createTask(aliceId, { title: 'a'.repeat(121) }),
      mongoose.Error.ValidationError
    );
  });

  test('rejette un statut inconnu', async () => {
    await assert.rejects(
      createTask(aliceId, { title: 'Statut bizarre', status: 'later' }),
      mongoose.Error.ValidationError
    );
  });
});

describe('listTasks', () => {
  test('ne liste que les tâches du propriétaire', async () => {
    await createTask(aliceId, { title: 'Tâche Alice 1' });
    await createTask(aliceId, { title: 'Tâche Alice 2' });
    await createTask(bobId, { title: 'Tâche Bob' });

    const tasks = await listTasks(aliceId);

    assert.equal(tasks.length, 2);
    for (const task of tasks) {
      assert.equal(task.ownerId.toString(), aliceId.toString());
    }
  });

  test('filtre par statut', async () => {
    await createTask(aliceId, { title: 'À faire' });
    await createTask(aliceId, { title: 'En cours', status: 'doing' });
    await createTask(aliceId, { title: 'Terminée', status: 'done' });

    const tasks = await listTasks(aliceId, { status: 'done' });

    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].title, 'Terminée');
  });

  test('retourne une liste vide si le propriétaire n\'a aucune tâche', async () => {
    await createTask(bobId, { title: 'Tâche Bob' });

    const tasks = await listTasks(aliceId);

    assert.deepEqual(tasks, []);
  });
});

describe('getOneTask', () => {
  test('retourne la tâche du propriétaire', async () => {
    const created = await createTask(aliceId, { title: 'Lire un livre' });

    const task = await getOneTask(aliceId, created._id);

    assert.equal(task.title, 'Lire un livre');
  });

  test('retourne null pour la tâche d\'un autre propriétaire', async () => {
    const created = await createTask(bobId, { title: 'Secret de Bob' });

    const task = await getOneTask(aliceId, created._id);

    assert.equal(task, null);
  });

  test('retourne null si la tâche n\'existe pas', async () => {
    const task = await getOneTask(aliceId, unknownId);

    assert.equal(task, null);
  });
});

describe('updateTask', () => {
  test('met à jour uniquement les champs fournis', async () => {
    const created = await createTask(aliceId, {
      title: 'Coder le back',
      description: 'Express + Mongo',
    });

    const task = await updateTask(aliceId, created._id, { status: 'done' });

    assert.equal(task.status, 'done');
    assert.equal(task.title, 'Coder le back');
    assert.equal(task.description, 'Express + Mongo');
  });

  test('applique les validateurs du schéma', async () => {
    const created = await createTask(aliceId, { title: 'Valide' });

    await assert.rejects(
      updateTask(aliceId, created._id, { status: 'later' }),
      mongoose.Error.ValidationError
    );
    await assert.rejects(
      updateTask(aliceId, created._id, { title: 'a'.repeat(121) }),
      mongoose.Error.ValidationError
    );
  });

  test('ne modifie pas la tâche d\'un autre propriétaire', async () => {
    const created = await createTask(bobId, { title: 'Tâche Bob' });

    const task = await updateTask(aliceId, created._id, { title: 'Piratée' });

    assert.equal(task, null);
    const untouched = await Task.findById(created._id);
    assert.equal(untouched.title, 'Tâche Bob');
  });

  test('retourne null si la tâche n\'existe pas', async () => {
    const task = await updateTask(aliceId, unknownId, { title: 'Fantôme' });

    assert.equal(task, null);
  });
});

describe('deleteTask', () => {
  test('supprime la tâche et la renvoie', async () => {
    const created = await createTask(aliceId, { title: 'À supprimer' });

    const task = await deleteTask(aliceId, created._id);

    assert.equal(task.title, 'À supprimer');
    assert.equal(await Task.findById(created._id), null);
  });

  test('ne supprime pas la tâche d\'un autre propriétaire', async () => {
    const created = await createTask(bobId, { title: 'Tâche Bob' });

    const task = await deleteTask(aliceId, created._id);

    assert.equal(task, null);
    assert.ok(await Task.findById(created._id));
  });

  test('retourne null si la tâche n\'existe pas', async () => {
    const task = await deleteTask(aliceId, unknownId);

    assert.equal(task, null);
  });
});
