import mongoose from 'mongoose'
import * as userService from '../services/userService.js'

function handleError(error, response) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
        return response.status(400).json({ message: error.message })
    }
    if (error.code === 11000) {
        return response.status(409).json({ message: "Nom d'utilisateur ou email déjà utilisé" })
    }
    throw error
}

export async function getCurrentUser(request, response) {
    try {
        const user = await userService.getUserById(request.user._id)
        if (!user) return response.status(404).json({ message: "Utilisateur introuvable" })
        return response.status(200).json({ message: "Utilisateur récupéré : ", user: user })
    } catch (error) {
        return handleError(error, response)
    }

}

export async function getAllUsers(_request, response) {
    const users = await userService.listUsers()
    return response.status(200).json({ message: "Utilisateurs récupérés : ", users: users })
}

export async function getUser(request, response) {
    try {
        const user = await userService.getUserById(request.params.id)
        if (!user) return response.status(404).json({ message: "Utilisateur introuvable" })
        return response.status(200).json({ message: "Utilisateur récupéré : ", user: user })
    } catch (error) {
        return handleError(error, response)
    }
}

export async function createUser(request, response) {
    try {
        const user = await userService.createUser(request.body ?? {})
        return response.status(201).json({ message: "Utilisateur créé : ", user: user })
    } catch (error) {
        return handleError(error, response)
    }
}

export async function updateUser(request, response) {
    try {
        const user = await userService.updateUser(request.params.id, request.body ?? {})
        if (!user) return response.status(404).json({ message: "Utilisateur introuvable" })
        return response.status(200).json({ message: "Utilisateur mis à jour : ", user: user })
    } catch (error) {
        return handleError(error, response)
    }
}

export async function deleteUser(request, response) {
    try {
        const user = await userService.deleteUser(request.params.id)
        if (!user) return response.status(404).json({ message: "Utilisateur introuvable" })
        return response.status(204).send()
    } catch (error) {
        return handleError(error, response)
    }
}
