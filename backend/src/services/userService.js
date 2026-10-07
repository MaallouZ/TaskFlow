import User from '../models/User.js'

const HIDDEN_FIELDS = '-password'

export function listUsers() {
    return User.find().select(HIDDEN_FIELDS)
}

export function getUserById(id) {
    return User.findById(id).select(HIDDEN_FIELDS)
}

export async function createUser({ username, email, password }) {
    const user = await User.create({ username, email, password })
    const { password: _password, ...safeUser } = user.toObject()
    return safeUser
}

export function updateUser(id, { username, email, password, timezone }) {
    const updates = {}
    if (username !== undefined) updates.username = username
    if (email !== undefined) updates.email = email
    if (password !== undefined) updates.password = password
    if (timezone !== undefined) updates.timezone = timezone
    return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select(HIDDEN_FIELDS)
}

export function deleteUser(id) {
    return User.findByIdAndDelete(id).select(HIDDEN_FIELDS)
}
