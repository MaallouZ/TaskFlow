import mongoose from 'mongoose';

const habitSchema =  new mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    frequency: { type: String, enum: ["daily", "weekly"], required: true },
    targetPerPeriod: { type: Number, min: 1, max: 31 },
    completedDates: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Habit', habitSchema);