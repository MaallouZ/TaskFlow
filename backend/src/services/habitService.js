import Habit from '../models/Habit.js';

export async function createHabit(userId, habitData) {
    const habit = await Habit.create({
        ...habitData,
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
        { $set: habitData },
        { new: true, runValidators: true }
    );
}

export async function deleteHabit(userId, habitId) {
    return Habit.findOneAndDelete({ _id: habitId, userId });
}