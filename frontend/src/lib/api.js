import { getClientId } from './clientId';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${BASE_URL}/api${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'X-Client-Id': getClientId(),
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.details);
  }
  return data;
}

export const tasksApi = {
  list: (params) => request('/tasks', { params }),
  weeks: (tz) => request('/tasks/weeks', { params: { tz } }),
  get: (id) => request(`/tasks/${id}`),
  create: (task) => request('/tasks', { method: 'POST', body: task }),
  update: (id, patch) => request(`/tasks/${id}`, { method: 'PATCH', body: patch }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
