# Backend learning path

This project is adding the README's Node.js + Express + PostgreSQL + Prisma backend alongside the existing Firebase prototype. Firebase remains available for the emulator path; the local PostgreSQL path is an opt-in learning mode. Do not use real participant data in this local learning setup. The local capture endpoints are intentionally available only when `PUPPY_LOCAL_TRIAL_CAPTURE=true` and `NODE_ENV=development`.

## First milestone: run the API and database

1. Install Node.js 22 and npm 11, then install Rancher Desktop and select the `dockerd (moby)` container engine.
2. Copy `backend/.env.example` to `backend/.env`.
3. From the project root, start PostgreSQL with `docker compose up -d`.
4. In `backend/`, run `npm install`, then `npx prisma migrate dev --name initial_puppy_study` the first time. Later schema changes use `npm run db:migrate`.
5. From the project root, run `npm run dev`. Open `http://localhost:3001/api/health`; a healthy response confirms that Express reached PostgreSQL.
6. To run a local trial, open `http://localhost:3001/?backend=postgres`, create or resume a puppy, and complete the daily visit. The response is saved to PostgreSQL. On a phone connected to the same Wi-Fi, use the computer's private IPv4 address instead of `localhost`, for example `http://192.168.1.23:3001/?backend=postgres`. Keep the backend terminal running while using the app.
7. To browse saved records on the computer, run `npm run db:studio` from the project root and open the local Prisma Studio address shown in the terminal. Look at the `Participant` and `DailyResponse` tables.

## What each piece does

- Rancher Desktop runs the PostgreSQL container on your computer. It does not provide the database software as a hosted service.
- PostgreSQL stores the relational records. `Participant` is the participant profile; `DailyResponse` stores one response per study day.
- Prisma maps JavaScript objects to PostgreSQL tables. `schema.prisma` is the model definition, and migrations are versioned changes to the database structure.
- Express listens for HTTP requests. `server.js` currently exposes a health endpoint that checks both the API process and database connection.
- In local PostgreSQL mode (`?backend=postgres`), the app posts enrollment and daily trial responses to Express. Each response records study day/date, the participant's mood prediction, the puppy's displayed mood, feeding/play completion, and submission time.
- `npm run db:studio` opens Prisma Studio, a local table browser for inspecting the saved records.
- Prisma 7 generates its client into `backend/generated/prisma`; generated files are disposable and should not be committed.

The local capture API uses Zod validation and has no participant login yet. Use it only for your own dummy trials on a trusted local network; it is not ready for participants or deployment. Participant authentication/recovery, protocol conditions, audit logs, and an approved data plan are still needed before research collection. SMS queues and deployment come later.
