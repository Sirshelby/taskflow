# TaskFlow

A full-stack task manager with email/password authentication, SQLite database, and a dark modern UI.

![TaskFlow](https://img.shields.io/badge/React-18-blue) ![Express](https://img.shields.io/badge/Express-4-green) ![SQLite](https://img.shields.io/badge/SQLite-3-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Authentication** — Email/password registration and login with bcrypt hashing and session-based auth
- **Task Management** — Create, edit, delete tasks with status cycling (To Do → In Progress → Done)
- **Priority Levels** — Low, Medium, High with color-coded badges
- **Due Dates** — Optional due date tracking per task
- **Filtering** — Filter tasks by status with live counts
- **Dark/Light Mode** — Toggle between themes (dark by default)
- **Responsive** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| UI | shadcn/ui, Tailwind CSS, Lucide Icons |
| State | TanStack React Query |
| Backend | Express.js |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle ORM |
| Auth | bcryptjs, express-session |
| Font | General Sans (Fontshare) |

## Getting Started

```bash
# Install dependencies
npm install

# Push the database schema
npx drizzle-kit push

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5000`.

## Project Structure

```
taskflow/
├── client/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/ui/   # shadcn/ui components
│   │   ├── hooks/           # useAuth, useTheme
│   │   ├── pages/           # Auth, Dashboard
│   │   ├── lib/             # API client, utilities
│   │   ├── App.tsx          # Root component with auth gating
│   │   └── index.css        # Tailwind + dark/light theme tokens
│   └── index.html
├── server/                  # Backend (Express)
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API routes (auth + tasks)
│   └── storage.ts           # Database access layer (Drizzle)
├── shared/
│   └── schema.ts            # Shared types, Drizzle tables, Zod schemas
├── drizzle.config.ts
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| POST | `/api/auth/logout` | Yes | Sign out |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/tasks` | Yes | List all tasks |
| POST | `/api/tasks` | Yes | Create a task |
| PATCH | `/api/tasks/:id` | Yes | Update a task |
| DELETE | `/api/tasks/:id` | Yes | Delete a task |

## Build for Production

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## License

MIT
