import mongoose from 'mongoose'

const TASK_STATUSES = ['todo', 'doing', 'done']

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, trim: true },
        status: { type: String, enum: TASK_STATUSES, default: 'todo' },
        deadline: { type: Date },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        completedAt: { type: Date },
    },
    { timestamps: true }
)

taskSchema.index({ ownerId: 1, status: 1, completedAt: 1 });

export const Task = mongoose.model('Task', taskSchema);