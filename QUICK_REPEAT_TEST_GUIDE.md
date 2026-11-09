# Puppy App: Quick Repeat Test Guide

Use this guide after the one-time setup is complete. It covers repeat testing of the local backend and the deployed Render staging app.

## Choose Where to Test

- **Local:** Uses the PostgreSQL container on this computer. Start Rancher Desktop first.
- **Cloud:** Uses the deployed Render service and Neon database. No local Docker database is needed.

These environments have separate databases and separate participant records.

## Repeat a Local Test

### 1. Start the local database

Open Rancher Desktop and wait until its container engine is running. In a VS Code terminal at the project root, run:

```powershell
docker compose up -d
docker compose ps
```

`docker compose up -d` starts the existing PostgreSQL container in the background. `docker compose ps` lets you confirm that it is running and healthy. Its named volume keeps local test records between sessions.

### 2. Start the app

In a terminal at the project root, run:

```powershell
npm run dev
```

This starts the Node.js backend. It serves the app and API on port 3001 and connects to the local database using `backend/.env`. Keep this terminal open while testing.

Check the connection at:

```text
http://localhost:3001/api/health
```

Continue when it reports:

```json
{"ok":true,"database":"connected"}
```

### 3. Check the trial order

Open:

```text
http://localhost:3001/admin
```

Sign in with the local researcher password in `backend/.env`. Confirm an active trial-order set is listed. Upload a CSV only if there is no active set or you intentionally want to replace it; uploading is not part of every repeat test.

### 4. Complete a fresh participant visit

Open this in a private/incognito browser window:

```text
http://localhost:3001/?backend=postgres
```

Create a new test participant and save the recovery code shown during enrollment. Complete the visit and confirm the completion message appears.

The server locks a participant's completed study day. To repeat a Day 1 visit on the same date, create a new test participant in a fresh private window. The study day follows the actual calendar date; this database flow does not have a “next day” simulation button.

### 5. Optionally inspect saved records

In a second terminal at the project root, run:

```powershell
npm run db:studio
```

Open the Prisma Studio address printed in that terminal (usually `http://localhost:5555`). Inspect `Participant` and `DailyResponse` to confirm enrollment and visit data were saved. Press **Ctrl+C** in the Studio terminal when finished.

### 6. Stop the local session

Press **Ctrl+C** in the backend terminal, then run:

```powershell
docker compose stop
```

This stops PostgreSQL and preserves its local data volume for your next session. Do not use `docker compose down -v` unless you intend to delete that volume and its records.

## Repeat a Cloud Staging Test

Use the Render service URL shown on its Render Dashboard. Check the database connection first:

```text
https://YOUR-SERVICE.onrender.com/api/health
```

Continue when the result reports `"database":"connected"`. Then:

1. Open `https://YOUR-SERVICE.onrender.com/admin` and sign in with the Render `ADMIN_PASSWORD`.
2. Confirm a trial-order set is active. Upload one only if needed.
3. Open `https://YOUR-SERVICE.onrender.com/?backend=postgres` in a private/incognito window.
4. Create a new test participant, save the recovery code, complete the visit, and confirm the completion message.

Each new visit is saved to the Neon cloud database, not the local PostgreSQL container. A free Render service may need about a minute to wake after inactivity. Use synthetic test data in staging.

To review submitted answers, open the same `/admin` page, sign in, and use the **Participant Responses** table. Select **Refresh** to load the latest records or **Export CSV** to download them. Keep the CSV in the storage location approved for your study.

Render Free web services spin down after 15 minutes without inbound traffic and wake when the next request arrives. There is no Free setting that keeps the service continuously running; paid compute plans stay on and incur a recurring compute charge. Check [Render's current pricing](https://render.com/pricing) before changing plans. See [Render's Free service limits](https://render.com/docs/free).

## Quick Troubleshooting

| Symptom | Check |
| --- | --- |
| `localhost:3001` does not open | Confirm the `npm run dev` terminal is still running. |
| Local health check reports a database error | Confirm Rancher Desktop is running and `docker compose ps` shows PostgreSQL as healthy. |
| “No trial order is active” | Sign in to `/admin`, activate a valid trial-order CSV, then enroll a new participant. |
| A participant is locked for today | Use a new test participant in a fresh private/incognito window. |
| Cloud health check fails | Check that the Render service is **Live** and inspect its latest deploy/runtime logs. |
| Cloud page is slow on first open | The free Render service may be waking from idle; wait and refresh once. |

Do not share participant recovery codes, passwords, or database connection strings in screenshots or chat.
