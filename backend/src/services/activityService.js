import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import Habit from '../models/Habit.js';
import { listDays } from '../utils/dates.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const utcMidnight = (date) => Date.parse(`${date}T00:00:00Z`);

async function countTasksByDay(ownerId, from, to, timeZone) {
    const rows = await Task.aggregate([
        {
            $match: {
                ownerId,
                status: 'done',
                completedAt: {
                    $gte: new Date(utcMidnight(from) - DAY_MS),
                    $lt: new Date(utcMidnight(to) + 2 * DAY_MS),
                },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: timeZone } },
                count: { $sum: 1 },
            },
        },
    ]);
    return new Map(rows.map((row) => [row._id, row.count]));
}

async function countHabitsByDay(userId, from, to) {
    const rows = await Habit.aggregate([
        { $match: { userId } },
        { $unwind: '$completedDates' },
        { $match: { completedDates: { $gte: from, $lte: to } } },
        { $group: { _id: '$completedDates', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [row._id, row.count]));
}

export async function getActivity(userId, { from, to, timeZone, source = 'all' }) {
    const id = new mongoose.Types.ObjectId(userId);
    const [taskCounts, habitCounts] = await Promise.all([
        source === 'habits' ? new Map() : countTasksByDay(id, from, to, timeZone),
        source === 'tasks' ? new Map() : countHabitsByDay(id, from, to),
    ]);

    const days = listDays(from, to).map((date) => {
        const tasks = taskCounts.get(date) ?? 0;
        const habits = habitCounts.get(date) ?? 0;
        return { date, tasks, habits, total: tasks + habits };
    });
    const max = Math.max(0, ...days.map((day) => day.total));

    return { timezone: timeZone, from, to, max, days };
}