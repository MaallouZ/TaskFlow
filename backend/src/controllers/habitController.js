import * as habitService from '../services/habitService.js';
import * as userService from '../services/userService.js';
import { isValidDateString, todayInTimeZone } from '../utils/dates.js';

export async function createHabit(request, response) {
    const habit = await habitService.createHabit(request.userId, request.body);
    return response.status(201).json({ message: "Habitude créée : ", habit });
}

export async function getAllHabits(request, response) {
    const habits = await habitService.getAllHabits(request.userId);
    return response.status(200).json({ message: "Habitudes récupérées : ", habits });
}

export async function getHabitById(request, response) {
    const habit = await habitService.getHabitById(
        request.userId,
        request.params.habitId
    )
    if (!habit) {
        return response.status(404).json({
            message: "Habitude introuvable"
        })
    }
    return response.status(200).json({ message: "Habitude récupérée : ", habit });
}

export async function updateHabit(request, response) {
    const updatedHabit = await habitService.updateHabit(
        request.userId,
        request.params.habitId,
        request.body
    )
    if (!updatedHabit) {
        return response.status(404).json({
            message: "Habitude introuvable"
        })
    }
    return response.status(200).json({
        message: "Habitude mise à jour : ",
        habit: updatedHabit
    })
}

export async function deleteHabit(request, response) {
    const deletedHabit = await habitService.deleteHabit(
        request.userId,
        request.params.habitId
    )
    if (!deletedHabit) {
        return response.status(404).json({
            message: "Habitude introuvable"
        })
    }
    return response.status(200).json({
        message: "Habitude supprimée : ",
        habit: deletedHabit
    })
}

export async function addCompletion(request, response) {
    const { habitId, date } = request.params;
    if (!isValidDateString(date)) {
        return response.status(400).json({ message: "Date invalide (format AAAA-MM-JJ)." });
    }
    const user = await userService.getUserById(request.userId);
    if (date > todayInTimeZone(user.timezone)) {
        return response.status(400).json({ message: "Impossible de cocher un jour futur." });
    }
    const habit = await habitService.addCompletion(request.userId, habitId, date);
    if (!habit) return response.status(404).json({ message: "Habitude introuvable" });
    return response.status(200).json({ message: "Habitude cochée : ", habit });
}

export async function removeCompletion(request, response) {
    const { habitId, date } = request.params;
    if (!isValidDateString(date)) {
        return response.status(400).json({ message: "Date invalide (format AAAA-MM-JJ)." });
    }
    const habit = await habitService.removeCompletion(request.userId, habitId, date);
    if (!habit) return response.status(404).json({ message: "Habitude introuvable" });
    return response.status(200).json({ message: "Habitude décochée : ", habit });
}