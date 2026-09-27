# Task Tracker

A full-stack task and time tracking application built as part of the Suntek AI Full Stack Engineer assignment.

Users can create and manage tasks, track time using a real-time timer, review their time logs, and view a daily productivity summary.

## Live Demo

[View Live Application]: https://task-time-tracker-plum.vercel.app/

## Features

### Authentication

- Sign up with email and password
- Log in and log out
- Protected application routes
- User-specific task and time-log data
- Row Level Security for database-level authorization

### Task Management

- Create tasks with a title and optional description
- View all tasks
- Edit task details
- Change task status:
  - Pending
  - In Progress
  - Completed
- Delete tasks

### Time Tracking

- Start and stop a timer for any task
- Live elapsed-time display
- Timer state persists across page refreshes
- Each tracking session is stored as a time log
- Total tracked time is displayed for each task
- Only one timer can be active per user at a time

### Daily Summary

The dashboard displays:

- Total time tracked today
- Number of tasks worked on today
- Completed tasks
- Pending and in-progress tasks
- Time spent on individual tasks today

### Time Log History

Users can review previous tracking sessions including:

- Task
- Start time
- End time
- Duration

Completed time logs can also be deleted.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Zod
- Vercel

## Architecture

The application uses Next.js App Router and REST Route Handlers.

The frontend communicates with API routes such as:

```text
GET     /api/tasks
POST    /api/tasks
GET     /api/tasks/:id
PATCH   /api/tasks/:id
DELETE  /api/tasks/:id

POST    /api/tasks/:id/timer/start
POST    /api/tasks/:id/timer/stop

GET     /api/time-logs
DELETE  /api/time-logs/:id
```
