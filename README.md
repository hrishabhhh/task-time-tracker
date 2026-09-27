# Task Tracker

A full-stack task and time tracking application built for the **Suntek AI Full Stack Engineer assignment**.

The application allows users to manage tasks, track time with a real-time timer, review previous work sessions, and view a daily productivity summary.

## Live Demo

https://task-time-tracker-plum.vercel.app/

## GitHub Repository

[`YOUR_GITHUB_REPOSITORY_URL`](https://github.com/hrishabhhh/task-time-tracker)

> Replace the placeholder above with your actual GitHub repository URL before submission.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Application Architecture](#application-architecture)
- [API Endpoints](#api-endpoints)
- [Authentication and Authorization](#authentication-and-authorization)
- [Timer Design](#timer-design)
- [Database Schema](#database-schema)
- [Validation and Error Handling](#validation-and-error-handling)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Production Build](#production-build)
- [Deployment](#deployment)
- [Demo Account](#demo-account)
- [Security Considerations](#security-considerations)
- [Assignment Requirements Covered](#assignment-requirements-covered)
- [AI Usage](#ai-usage)
- [Assignment Notes](#assignment-notes)
- [Author](#author)

---

## Features

### Authentication

- User signup with email and password
- User login
- User logout
- Protected application routes
- Protected API routes
- User-specific task and time-log data
- Database-level authorization using Supabase Row Level Security

### Task Management

Users can:

- Create tasks
- Add an optional description
- View all their tasks
- Edit task title and description
- Change task status
- Delete tasks

Supported task statuses:

- Pending
- In Progress
- Completed

### Real-Time Time Tracking

Each task supports start/stop time tracking.

Features include:

- Start a timer for a task
- Stop an active timer
- Live `HH:MM:SS` elapsed-time display
- Timer state persists across page refreshes
- Timer state is restored after logging out and logging back in
- Every tracking session is stored as a separate time log
- Total tracked time is displayed for each task
- Multiple work sessions are accumulated correctly
- Only one timer can be active per user at a time

### Time Log History

Users can review all previous tracking sessions.

Each time log displays:

- Task name
- Start time
- End time
- Duration

Completed time logs can be deleted.

An active time log cannot be deleted until its timer has been stopped.

### Daily Productivity Summary

The dashboard includes a summary for the current day showing:

- Total time tracked today
- Number of tasks worked on today
- Number of completed tasks
- Number of open tasks
- Pending task count
- In-progress task count
- Tasks worked on today
- Time spent on each task today

The daily calculation uses the user's local day boundary and correctly handles time logs that overlap midnight.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js Route Handlers
- REST API
- Zod validation

### Authentication and Database

- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security

### Deployment

- Vercel
- Supabase

---

## Application Architecture

The project uses the **Next.js App Router**.

The frontend communicates with REST API endpoints implemented using Next.js Route Handlers.

Authentication is handled by Supabase Auth using cookie-based sessions.

Authorization is enforced at two levels:

1. API-level checks using the authenticated user identity
2. Database-level Row Level Security policies

The application never trusts a user ID sent from the client as proof of ownership.

---

## API Endpoints

### Task API

```text
GET     /api/tasks
POST    /api/tasks

GET     /api/tasks/:id
PATCH   /api/tasks/:id
DELETE  /api/tasks/:id
```

### Timer API

```text
POST    /api/tasks/:id/timer/start
POST    /api/tasks/:id/timer/stop
```

### Time Log API

```text
GET     /api/time-logs
DELETE  /api/time-logs/:id
```

### HTTP Status Codes Used

```text
200 OK
201 Created
204 No Content

400 Bad Request
401 Unauthorized
404 Not Found
409 Conflict
500 Internal Server Error
```

---

## Authentication and Authorization

Authentication is handled with Supabase Auth.

Protected pages verify the authenticated user before rendering.

Protected API routes verify authentication before processing requests.

The authenticated user ID is obtained from the server-side Supabase session.

The application does **not** accept a client-provided `user_id` as proof of ownership.

In addition to API-level authorization, Supabase Row Level Security is enabled on both the `tasks` and `time_logs` tables.

A user can only access rows where:

```text
user_id = authenticated user id
```

This ensures that users cannot access or modify another user's tasks or time logs.

---

## Timer Design

The timer uses persisted timestamps rather than a browser counter as the source of truth.

When a timer starts, a new time log is created with:

```text
started_at = current timestamp
ended_at = null
duration_seconds = null
```

A `null` `ended_at` value represents an active timer.

When the user stops the timer, the backend calculates:

```text
duration = ended_at - started_at
```

and stores:

```text
ended_at
duration_seconds
```

The browser displays the live elapsed time using:

```text
current time - started_at
```

Because the start timestamp is stored in the database, an active timer survives:

- Page refreshes
- Browser tab inactivity
- Logging out and logging back in

The browser interval is only responsible for refreshing the visible counter. It is not the persistent source of tracked time.

### Multiple Sessions

A task can contain multiple time-tracking sessions.

Example:

```text
Task A
├── Session 1 - 15 minutes
├── Session 2 - 20 minutes
└── Session 3 - 10 minutes
```

Total tracked time:

```text
45 minutes
```

### One Active Timer Per User

The database contains a partial unique index that allows only one active time log per user.

Conceptually:

```sql
unique user_id
where ended_at is null
```

The API checks for an active timer before creating another one and returns `409 Conflict` when necessary.

The database constraint provides an additional safeguard against simultaneous requests.

---

## Database Schema

### `tasks`

```text
id
user_id
title
description
status
created_at
updated_at
```

Each task belongs to one authenticated user.

Task status can be:

```text
pending
in_progress
completed
```

### `time_logs`

```text
id
user_id
task_id
started_at
ended_at
duration_seconds
created_at
```

Each time log belongs to:

- One authenticated user
- One task

Deleting a task also removes its associated time logs through the database relationship.

---

## Validation and Error Handling

Request validation is handled with Zod.

Validation includes:

- Required task titles
- Maximum title length
- Maximum description length
- Allowed task statuses
- UUID validation for route parameters
- At least one field required for task updates

The application handles cases including:

- Invalid task data
- Invalid JSON requests
- Invalid UUIDs
- Unauthenticated requests
- Missing tasks
- Starting an already-running timer
- Starting another timer while one is active
- Stopping a timer that is not running
- Deleting an active time log
- Database errors

The database also contains validation constraints for:

- Allowed task statuses
- Valid task title length
- Non-negative durations
- End time occurring after start time
- Active/completed time log consistency

---

## Project Structure

```text
task-time-tracker/
│
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── [id]/
│   │   │   │   ├── timer/
│   │   │   │   │   ├── start/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── stop/
│   │   │   │   │       └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   │
│   │   └── time-logs/
│   │       ├── [id]/
│   │       │   └── route.ts
│   │       └── route.ts
│   │
│   ├── auth/
│   │   ├── actions.ts
│   │   └── signout/
│   │       └── route.ts
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── signup/
│   │   └── page.tsx
│   │
│   ├── time-logs/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── app-header.tsx
│   ├── daily-summary.tsx
│   ├── task-card.tsx
│   ├── task-manager.tsx
│   ├── task-timer.tsx
│   └── time-log-list.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── validations/
│   │   └── task.ts
│   ├── auth.ts
│   └── format-duration.ts
│
├── supabase/
│   └── schema.sql
│
├── types/
│   ├── task.ts
│   └── time-log.ts
│
├── proxy.ts
├── .env.example
└── README.md
```

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd task-time-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

Create a project in Supabase.

You will need:

```text
Supabase Project URL
Supabase Publishable Key
```

### 4. Configure environment variables

Create:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

A `.env.example` file is included for reference.

Do not commit `.env.local`.

### 5. Configure the database

Open the Supabase SQL Editor.

Run the SQL contained in:

```text
supabase/schema.sql
```

This creates:

- `tasks` table
- `time_logs` table
- Foreign keys
- Validation constraints
- Database indexes
- One-active-timer constraint
- Row Level Security policies
- Authenticated-user permissions

### 6. Authentication configuration

Enable email/password authentication in Supabase.

For this assignment deployment, email confirmation is disabled so users can immediately create an account and access the application.

### 7. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Production Build

Run the following before deployment:

```bash
npm run lint
```

Then:

```bash
npm run build
```

Both commands should complete successfully.

---

## Deployment

The application is deployed on Vercel.

### Live Application

https://task-time-tracker-plum.vercel.app/

### Vercel Environment Variables

Configure:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Production credentials are stored in Vercel environment variables and are not committed to the repository.

### Supabase Production Configuration

In Supabase authentication URL settings:

- Set the Site URL to the production Vercel URL
- Add the production application URL to allowed redirect URLs
- Keep the localhost URL available for local development if needed

Supabase provides:

- Authentication
- PostgreSQL database
- Row Level Security

Vercel hosts the Next.js application.

---

## Demo Account

No test credentials are required.

A reviewer can create a new account directly from the signup page.

---

## Security Considerations

The application includes multiple layers of protection:

- Password-based authentication
- Protected frontend routes
- Protected REST APIs
- Server-side authentication verification
- User-scoped database queries
- Supabase Row Level Security
- UUID validation
- Zod request validation
- PostgreSQL validation constraints
- One-active-timer database constraint
- Environment variables for configuration
- No client-provided user ID is trusted for authorization
- No private Supabase secret key is exposed to the client

---

## Assignment Requirements Covered

### Authentication

- [x] Sign up
- [x] Log in
- [x] Log out
- [x] Protected routes
- [x] Protected APIs
- [x] User data isolation

### Task Management

- [x] Create tasks
- [x] View tasks
- [x] Edit tasks
- [x] Delete tasks
- [x] Pending status
- [x] In Progress status
- [x] Completed status

### Real-Time Time Tracking

- [x] Start timer
- [x] Stop timer
- [x] Live elapsed time
- [x] Time logs
- [x] Multiple sessions
- [x] Total task time
- [x] Timer survives page refreshes
- [x] One active timer per user

### Daily Summary

- [x] Tasks worked on
- [x] Total time tracked
- [x] Completed tasks
- [x] Pending tasks
- [x] In-progress tasks
- [x] Time spent per task today

### Backend / API

- [x] REST API
- [x] Task CRUD
- [x] Time-log operations
- [x] Authorization
- [x] Input validation
- [x] Error handling
- [x] Meaningful HTTP responses
- [x] Organized route logic

### Deployment

- [x] Live deployment
- [x] Working authentication
- [x] Setup instructions
- [x] Environment configuration documentation

---

## AI Usage

AI tools were used during development for:

- Architectural guidance
- Implementation suggestions
- Code review
- Debugging
- API design discussion
- Validation and security review
- README and deployment guidance

The assignment explicitly permits AI usage.

The AI conversation and prompt history used during development is included separately with the submission as requested.

The application was developed and tested incrementally, with each major feature completed and verified before moving to the next stage.

---

## Assignment Notes

The assignment described AI-based task title and description enhancement as optional.

That optional feature was intentionally not included so development could focus on the required functionality:

- Authentication
- Authorization
- Task CRUD
- Reliable time tracking
- Time-log persistence
- Daily productivity summaries
- User data isolation
- Validation and error handling
- Deployment

---

## Author

Hrishabh
