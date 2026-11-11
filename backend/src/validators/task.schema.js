import { z } from 'zod';
import { PRIORITIES, STATUSES } from '../models/Task.js';

const date = z.coerce.date({ error: 'Must be a valid date' }).refine((d) => !Number.isNaN(d.getTime()), {
  message: 'Must be a valid date',
});

const taskFields = {
  title: z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().default(''),
  dueDate: date,
  endDate: date.nullable().optional(),
  priority: z.enum(PRIORITIES).nullable().optional(),
  status: z.enum(STATUSES).optional(),
};

const endAfterStart = (t) => !t.endDate || !t.dueDate || t.endDate >= t.dueDate;
const endAfterStartMsg = { message: 'End time must be after start time', path: ['endDate'] };

export const createTaskSchema = z.object(taskFields).strict().refine(endAfterStart, endAfterStartMsg);

export const updateTaskSchema = z
  .object({
    ...taskFields,
    description: z.string().trim().max(2000).optional(),
  })
  .partial()
  .strict()
  .refine((t) => Object.keys(t).length > 0, { message: 'Nothing to update' })
  .refine(endAfterStart, endAfterStartMsg);

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  from: date.optional(),
  to: date.optional(),
  status: z.enum(STATUSES).optional(),
});

const isValidTimeZone = (tz) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const weeksQuerySchema = z.object({
  tz: z.string().default('UTC').refine(isValidTimeZone, 'Invalid IANA time zone'),
});
