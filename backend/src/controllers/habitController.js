import * as habitService from '../services/habitService.js';

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