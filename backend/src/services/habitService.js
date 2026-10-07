import Habit from '../models/Habit.js';

function withoutProtectedFields(data) {
    const { userId, completedDates, ...clean } = data;
    return clean;
}

export async function createHabit(userId, habitData) {
    const habit = await Habit.create({
        ...withoutProtectedFields(habitData),
        userId
    });
    return habit;
}

export async function getAllHabits(userId) {
    return Habit.find({ userId });
}

export async function getHabitById(userId, habitId) {
    return Habit.findOne({ _id: habitId, userId });
}

export async function updateHabit(userId, habitId, habitData) {
    return Habit.findOneAndUpdate(
        { _id: habitId, userId },
        { $set: withoutProtectedFields(habitData) },
        { new: true, runValidators: true }
    );
}

export async function deleteHabit(userId, habitId) {
    return Habit.findOneAndDelete({ _id: habitId, userId });
}

export async function addCompletion(userId, habitId, date) {
    return Habit.findOneAndUpdate(
        { _id: habitId, userId },
        { $addToSet: { completedDates: date } },
        { new: true }
    );
}

export async function removeCompletion(userId, habitId, date) {
    return Habit.findOneAndUpdate(
        { _id: habitId, userId },
        { $pull: { completedDates: date } },
        { new: true }
    );
}