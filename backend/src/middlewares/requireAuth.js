import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function requireAuth(req, res, next) {
    const header = req.header('Authorization');
    const [scheme, token] = header?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        req.user = jwt.verify(token, config.jwtSecret);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
