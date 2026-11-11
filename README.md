# Weekly To-Do List — MERN

A mobile-first to-do app where tasks are scheduled by date and time and grouped into **Monday–Sunday weeks**. Each week has a card showing its open and completed task counts.

- **Frontend:** React 19, Vite, Tailwind CSS v4, TanStack Query, React Router, date-fns
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), Zod validation
- **Tests:** Vitest with Supertest and an in-memory MongoDB (API); Vitest with Testing Library (UI)

| | URL |
|---|---|
| Live app (Netlify) | _add after deploying_ |
| API (Render) | _add after deploying_ |

## Features

| Requirement | Where it lives |
|---|---|
| Create a task: title*, description, date & time*, priority | **+** button → *Add New Task* sheet (also has an optional end time, from the Figma) |
| Edit any field | Pencil icon, or tap a task → *Edit* |
| Delete | **Swipe left** on a task → *Delete* (trash icon on desktop) |
| Search by keyword in title and description | Search bar → search screen; results can be viewed, edited, completed or deleted |
| Tasks grouped by week, Monday to Sunday | Week strip (‹ › to change week) and the **Weekly Overview** cards |
| Week cards show open and completed counts and expand on tap | *Weekly Overview*; the current week is expanded by default |
| Mark a task Completed or In Progress | Checkbox, or the task details sheet; counts and progress update immediately |
| Responsive | Phone layout as in the Figma; two columns on desktop |

Screens follow the Figma: Onboarding → Home (search, week strip, *Task Complete* / *Task Pending* cards, *Weekly Progress*, *Tasks Today*) → *Add New Task* sheet → Search.

## Running locally

Requirements: Node 20 or newer. MongoDB is optional.

```bash
# 1. API — http://localhost:5050
cd backend
npm install
cp .env.example .env      # optional; without MONGODB_URI an in-memory MongoDB starts automatically
npm run dev

# 2. Frontend — http://localhost:5173 (in a second terminal)
cd frontend
npm install
npm run dev               # /api is proxied to localhost:5050
```

Run the tests with `npm test` in either folder.

## API

All `/api/tasks` routes require an `X-Client-Id` header (see [Design notes](#design-notes)).

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/tasks?q=&from=&to=&status=` | List tasks sorted by date. `q` searches title and description (case-insensitive); `from`/`to` is a `[from, to)` date range |
| GET | `/api/tasks/weeks?tz=Asia/Kolkata` | Weekly summary: `[{ weekStart, weekEnd, total, open, completed }]`, with Monday-based weeks in the caller's time zone |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create a task: `{ title, dueDate, endDate?, description?, priority?: low\|medium\|high, status? }` |
| PATCH | `/api/tasks/:id` | Partial update, including `status: completed\|in_progress` |
| DELETE | `/api/tasks/:id` | Delete a task (`204`) |

Validation errors return `400 { error, details: [{ field, message }] }`.

## Project structure

```
backend/
  src/
    app.js                  Express app (security headers, CORS, routes, error handling)
    server.js               Startup: connects to the database and starts the server
    config/db.js            Mongo connection (uses in-memory Mongo when no URI is set in dev)
    models/Task.js          Mongoose schema
    validators/             Zod request schemas
    controllers/            Route handlers
    routes/                 Route definitions
    middleware/             Client-id check and error handler
  tests/                    API integration tests
frontend/
  src/
    pages/                  Onboarding, Home, Search
    components/             TaskItem, SwipeableRow, WeekStrip, WeekCard, sheets…
    hooks/useTasks.js       TanStack Query hooks (optimistic updates)
    lib/                    API client, date helpers
    test/                   UI tests against an in-memory fake API
```

## Design notes

- **Week grouping happens on the server and respects the user's time zone.** MongoDB's `$dateTrunc` with `startOfWeek: "monday"` and the browser's IANA time zone puts a task at 11 pm Sunday in the right week, wherever the user is. This is covered by tests.
- **No login.** The spec has no accounts, so each browser creates an anonymous ID (kept in `localStorage`) and sends it as `X-Client-Id`. Every query is scoped to that ID, so visitors to the public demo don't see each other's tasks. Real authentication (e.g. JWT) would replace this header.
- **Optimistic UI.** Toggling or deleting a task updates every cached list immediately, rolls back if the request fails, then refetches so the week counts stay accurate.
- **Search** uses an escaped, case-insensitive regex, so partial words like "fin" match "Finishing". A MongoDB text index only matches whole words.
- **Swipe to delete** is built with pointer events: it locks to the horizontal axis, uses `touch-action: pan-y` so vertical scrolling keeps working, and also works with a mouse drag.

## Deployment

1. **Database:** create a free MongoDB Atlas cluster and copy its connection string.
2. **API on Render:** create a new Blueprint from this repo. It reads `render.yaml`. Set `MONGODB_URI`, and set `CORS_ORIGIN` to the Netlify URL.
3. **Frontend on Netlify:** add the site from the repo with base directory `frontend`. The build settings come from `frontend/netlify.toml`. Set the environment variable `VITE_API_URL=https://<your-api>.onrender.com`.
