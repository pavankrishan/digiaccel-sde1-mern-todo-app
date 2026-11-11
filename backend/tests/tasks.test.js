import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Task } from '../src/models/Task.js';

let mongo;
const app = createApp();
const CLIENT = 'test-client-123';
const OTHER = 'other-client-456';

const api = (clientId = CLIENT) => ({
  get: (url) => request(app).get(url).set('X-Client-Id', clientId),
  post: (url, body) => request(app).post(url).set('X-Client-Id', clientId).send(body),
  patch: (url, body) => request(app).patch(url).set('X-Client-Id', clientId).send(body),
  delete: (url) => request(app).delete(url).set('X-Client-Id', clientId),
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe('POST /api/tasks', () => {
  it('creates a task with defaults', async () => {
    const res = await api().post('/api/tasks', {
      title: '  Finishing Wireframe ',
      dueDate: '2026-11-12T10:00:00.000Z',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Finishing Wireframe',
      description: '',
      status: 'in_progress',
      priority: null,
    });
    expect(res.body.id).toBeTruthy();
    expect(res.body.clientId).toBeUndefined();
  });

  it('requires title and dueDate', async () => {
    const res = await api().post('/api/tasks', { description: 'x' });
    expect(res.status).toBe(400);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'dueDate']));
  });

  it('rejects an invalid priority and end before start', async () => {
    const bad = await api().post('/api/tasks', { title: 'a', dueDate: '2026-11-12T10:00Z', priority: 'urgent' });
    expect(bad.status).toBe(400);

    const order = await api().post('/api/tasks', {
      title: 'a',
      dueDate: '2026-11-12T10:00Z',
      endDate: '2026-11-12T09:00Z',
    });
    expect(order.status).toBe(400);
    expect(order.body.details[0].field).toBe('endDate');
  });

  it('requires the X-Client-Id header', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'a', dueDate: '2026-11-12' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tasks', () => {
  beforeEach(async () => {
    await api().post('/api/tasks', { title: 'Finishing Wireframe', dueDate: '2026-11-10T10:00Z' });
    await api().post('/api/tasks', { title: 'Meeting with team', description: 'finish agenda', dueDate: '2026-11-12T10:00Z' });
    await api().post('/api/tasks', { title: 'Buy a cat food', dueDate: '2026-11-20T10:00Z' });
    await api(OTHER).post('/api/tasks', { title: 'Finish other user task', dueDate: '2026-11-12T10:00Z' });
  });

  it('lists only the caller’s tasks sorted by date', async () => {
    const res = await api().get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['Finishing Wireframe', 'Meeting with team', 'Buy a cat food']);
  });

  it('searches title and description case-insensitively', async () => {
    const res = await api().get('/api/tasks?q=FINISH');
    expect(res.body.map((t) => t.title).sort()).toEqual(['Finishing Wireframe', 'Meeting with team']);
  });

  it('treats regex characters in search literally', async () => {
    const res = await api().get('/api/tasks?q=.*');
    expect(res.body).toHaveLength(0);
  });

  it('filters by date range [from, to)', async () => {
    const res = await api().get('/api/tasks?from=2026-11-09T00:00Z&to=2026-11-16T00:00Z');
    expect(res.body).toHaveLength(2);
  });
});

describe('PATCH / DELETE /api/tasks/:id', () => {
  it('updates fields and toggles status', async () => {
    const { body: task } = await api().post('/api/tasks', { title: 'a', dueDate: '2026-11-12T10:00Z' });

    const res = await api().patch(`/api/tasks/${task.id}`, { title: 'b', priority: 'high', status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'b', priority: 'high', status: 'completed' });
    expect(res.body.completedAt).toBeTruthy();

    const back = await api().patch(`/api/tasks/${task.id}`, { status: 'in_progress' });
    expect(back.body.completedAt).toBeNull();
  });

  it('rejects an end time earlier than the stored start time', async () => {
    const { body: task } = await api().post('/api/tasks', { title: 'a', dueDate: '2026-11-12T10:00Z' });
    const res = await api().patch(`/api/tasks/${task.id}`, { endDate: '2026-11-12T08:00Z' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for another client’s task and 400 for a bad id', async () => {
    const { body: task } = await api().post('/api/tasks', { title: 'a', dueDate: '2026-11-12T10:00Z' });
    expect((await api(OTHER).patch(`/api/tasks/${task.id}`, { title: 'x' })).status).toBe(404);
    expect((await api(OTHER).delete(`/api/tasks/${task.id}`)).status).toBe(404);
    expect((await api().get('/api/tasks/not-an-id')).status).toBe(400);
  });

  it('deletes a task', async () => {
    const { body: task } = await api().post('/api/tasks', { title: 'a', dueDate: '2026-11-12T10:00Z' });
    expect((await api().delete(`/api/tasks/${task.id}`)).status).toBe(204);
    expect((await api().get(`/api/tasks/${task.id}`)).status).toBe(404);
  });
});

describe('GET /api/tasks/weeks', () => {
  it('groups tasks into Monday–Sunday weeks with open/completed counts', async () => {
    // Week of Mon 2026-11-09 .. Sun 2026-11-15
    await api().post('/api/tasks', { title: 'mon', dueDate: '2026-11-09T00:30:00Z' });
    await api().post('/api/tasks', { title: 'sun', dueDate: '2026-11-15T23:00:00Z', status: 'completed' });
    // Next week
    await api().post('/api/tasks', { title: 'next mon', dueDate: '2026-11-16T09:00:00Z' });

    const res = await api().get('/api/tasks/weeks?tz=UTC');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { weekStart: '2026-11-09T00:00:00.000Z', weekEnd: '2026-11-16T00:00:00.000Z', total: 2, completed: 1, open: 1 },
      { weekStart: '2026-11-16T00:00:00.000Z', weekEnd: '2026-11-23T00:00:00.000Z', total: 1, completed: 0, open: 1 },
    ]);
  });

  it('respects the caller’s time zone', async () => {
    // 20:00 UTC Sunday is already Monday 01:30 in India, i.e. the next week.
    await api().post('/api/tasks', { title: 'late sunday', dueDate: '2026-11-15T20:00:00Z' });
    const res = await api().get('/api/tasks/weeks?tz=Asia/Kolkata');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].weekStart).toBe('2026-11-15T18:30:00.000Z'); // Mon 16 Nov 00:00 IST
  });

  it('rejects an invalid time zone', async () => {
    const res = await api().get('/api/tasks/weeks?tz=Mars/Base');
    expect(res.status).toBe(400);
  });
});
