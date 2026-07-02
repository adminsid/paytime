# Paytime

A simple, self-hostable time tracking app for global virtual assistants.

## Features

- ⏱ **Live Timer** — Start/stop tracking with break support and live elapsed display
- 🏢 **Multi-Company** — Create or join companies; admins approve member requests
- 💰 **Hourly Rates** — Set your rate and currency per company
- 📄 **Auto Invoices** — Generate invoices from time logs; track draft → sent → paid
- 📊 **Reports** — Filter work sessions by date range, user, and company
- 🔐 **Auth** — Email/password authentication with JWT sessions
- 📱 **PWA** — Installable as a Progressive Web App on any device
- 🐳 **Self-hostable** — SQLite database, runs anywhere with Docker

## Quick Start

### Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env and set NEXTAUTH_SECRET to a long random string

# 3. Create the database and run migrations
npx prisma migrate dev

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production with Docker

```bash
# Copy and configure environment variables
cp .env.example .env
# Set NEXTAUTH_SECRET and NEXTAUTH_URL in .env

# Build and start
docker-compose up -d
```

The app will be available at `http://localhost:3000` with SQLite data persisted in a Docker volume.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | SQLite file path | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Secret for signing JWTs (use a long random string) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public URL of the app | `http://localhost:3000` |

> **PostgreSQL**: To use PostgreSQL instead of SQLite, change `DATABASE_URL` to a Postgres connection string and update `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router)
- **Database**: SQLite via [Prisma ORM](https://prisma.io)
- **Auth**: [NextAuth.js](https://next-auth.js.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Language**: TypeScript

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth, companies, timelogs, invoices, reports)
│   ├── dashboard/     # Protected app pages (timer, logs, reports, invoices, companies)
│   ├── login/         # Login page
│   └── register/      # Registration page
├── components/        # Shared UI components (DashboardNav)
├── lib/               # Prisma client, NextAuth options
└── types/             # TypeScript type extensions
prisma/
├── schema.prisma      # Database schema
└── migrations/        # Migration history
```
