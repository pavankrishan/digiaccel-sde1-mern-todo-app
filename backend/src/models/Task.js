import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUSES = ['in_progress', 'completed'];

const taskSchema = new mongoose.Schema(
  {
    // Anonymous per-device owner id (sent by the client in the X-Client-Id header).
    clientId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    // Scheduled date & start time of the task (mandatory).
    dueDate: { type: Date, required: true },
    // Optional end time (the Figma design has "Start" and "Ends").
    endDate: { type: Date, default: null },
    priority: { type: String, enum: [...PRIORITIES, null], default: null },
    status: { type: String, enum: STATUSES, default: 'in_progress' },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.clientId;
        return ret;
      },
    },
  },
);

taskSchema.index({ clientId: 1, dueDate: 1 });

// Keep completedAt in sync with status.
taskSchema.pre('save', function syncCompletedAt() {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'completed' ? new Date() : null;
  }
});

export const Task = mongoose.model('Task', taskSchema);
