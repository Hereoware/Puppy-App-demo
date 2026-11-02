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

## Upload and assign trial orders

The local researcher page is available at `http://localhost:3001/admin` after the database migration has run.

1. In Excel, open the generated workbook and select its `AllVersions` worksheet.
2. Save that worksheet as a UTF-8 CSV file. It must keep the `version`, `day`, `T`, `A`, `E`, `T_label`, and `A_label` columns. The importer expects 24 unique rows per version, binary T/A values, and integer E scores from -1 to 10.
3. Select the CSV on the admin page, check the preview, and choose **Validate and activate**. A newly uploaded set becomes active; future enrollments are randomly assigned one version from it. Existing participants keep their original assignment.
4. New local participants open `http://localhost:3001/?backend=postgres`. The API returns only their assigned trial for the current study day and records the scheduled T/A/E values with their prediction and interaction durations.

The import page and assignment API are gated by the local development flag. They have no researcher authentication and are not a hosted admin system. Do not expose this server to the internet or use real participant data with it.

## What each piece does

- Rancher Desktop runs the PostgreSQL container on your computer. It does not provide the database software as a hosted service.
- PostgreSQL stores the relational records. `Participant` is the participant profile; `DailyResponse` stores one response per study day.
- Prisma maps JavaScript objects to PostgreSQL tables. `schema.prisma` is the model definition, and migrations are versioned changes to the database structure.
- Express listens for HTTP requests. `server.js` currently exposes a health endpoint that checks both the API process and database connection.
- In local PostgreSQL mode (`?backend=postgres`), the app posts enrollment and daily trial responses to Express. Each response records study day/date, the participant's mood prediction, the puppy's displayed mood, feeding/play completion, and submission time.
- `npm run db:studio` opens Prisma Studio, a local table browser for inspecting the saved records.
- Prisma 7 generates its client into `backend/generated/prisma`; generated files are disposable and should not be committed.

The local capture API uses Zod validation and has no participant login or researcher authentication yet. Use it only for your own dummy trials on a trusted local network; it is not ready for participants or deployment. Participant authentication/recovery, protocol conditions, audit logs, and an approved data plan are still needed before research collection. SMS queues and deployment come later.
