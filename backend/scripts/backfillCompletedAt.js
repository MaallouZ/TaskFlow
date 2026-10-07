import { config } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { Task } from '../src/models/Task.js';

await connectDb(config.mongoUri);

const result = await Task.collection.updateMany(
    { status: 'done', completedAt: { $exists: false } },
    [{ $set: { completedAt: '$updatedAt' } }]
);
console.log(`${result.modifiedCount} tâche(s) mise(s) à jour.`);

await disconnectDb();