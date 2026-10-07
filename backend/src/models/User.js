import mongoose from 'mongoose';
import { isValidTimeZone } from '../utils/timezone.js';

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true, unique: true, maxlength: 30 },
        email: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
        password: { type: String, required: true, trim: true },
        timezone: { type: String, default: 'UTC', validate: { validator: isValidTimeZone, message: 'Invalid timezone' } }
    },
    { timestamps: true }
);

export default mongoose.model('User', userSchema);