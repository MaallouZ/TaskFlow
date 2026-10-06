import mongoose from 'mongoose'
import * as authService from '../services/authService.js'

function handleError(error, res) {
    if (error.status) {
        return res.status(error.status).json({ message: error.message })
    }
    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ message: error.message })
    }
    throw error
}

export async function register(req, res) {
    try {
        const user = await authService.register(req.body)
        return res.status(201).json(user);
    } catch (error) {
        return handleError(error, res)
    }
}

export async function login(req, res) {
    try {
        const result = await authService.login(req.body)
        return res.status(200).json(result)
    } catch (error) {
        return handleError(error, res)
    }
}
