import bcrypt from 'bcryptjs';
import User from "../models/User.js"
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

export async function register({ username, email, password } = {}) {
    if (!username || !email || !password) {
        throw httpError(400, "username, email and password are required");
    }
    if (await User.exists({ $or: [{ email }, { username }] })) {
        throw httpError(409, "Username or email already exists");
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ username, email, password: passwordHash });
    return { _id: user._id, username: user.username, email: user.email }
}

export async function login({ username, password } = {}) {
    if (!username || !password) {
        throw httpError(400, "username and password are required");
    }
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw httpError(401, "Invalid credentials");
    }
    const token = jwt.sign({ _id: user._id }, config.jwtSecret, { expiresIn: "7d" });
    return { token }
}
