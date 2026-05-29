# LexiBoard

> A drag-and-drop task board application — organize work across columns with a Node.js/Express backend and a React + Vite frontend.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)

---

## Overview

LexiBoard is a Kanban-style task management application. Users can create tasks and drag them across board columns in real time, powered by `@hello-pangea/dnd`. The frontend communicates with a RESTful Express API backed by PostgreSQL via Supabase.

---

## Tech Stack

| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Frontend | React, Vite, Axios, `@hello-pangea/dnd`    |
| Backend  | Node.js, Express, `cors`, `dotenv`         |
| Database | PostgreSQL (`pg`, `@supabase/supabase-js`) |

---

## Project Structure

```
lexiboard/
├── backend/
│   ├── app.js              # Express application entry point
│   ├── config/
│   │   └── db.js           # Database connection setup
│   ├── routes/             # API route definitions
│   └── controllers/        # Request handler functions
│
└── frontend/
    └── src/                # React application source files
```

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/) and npm

---

## Getting Started

Clone the repository and install dependencies for both services:

```bash
git clone https://github.com/your-org/lexiboard.git
cd lexiboard
```

**Install backend dependencies:**

```bash
cd backend
npm install
```

**Install frontend dependencies:**

```bash
cd ../frontend
npm install
```

---

## Running the App

Start both services in separate terminal windows.

**Start the backend API:**

```bash
cd backend
node app.js
```

**Start the frontend dev server:**

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default) and the backend API at `http://localhost:5000`.

---

_LexiBoard — simple, visual task management._
