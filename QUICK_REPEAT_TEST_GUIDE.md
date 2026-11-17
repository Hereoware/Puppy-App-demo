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

The schedule is selected per participant, not by a shared server setting. Long-timeframe participants advance one calendar day at a time. Short-timeframe participants can continue to the next study day immediately after finishing the current day.

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

The local example password is `puppy-local-admin`, unless `ADMIN_PASSWORD` in your private `backend/.env` sets another value. This is a development password only. Do not use it for an online service.

Sign in with the local researcher password in `backend/.env`. Confirm the active trial-order sets are assigned to HIT-T (Treatment 1), HIT-A (Treatment 2), or LIT (Control), as appropriate. Upload a CSV only if there is no active set for a group or you intentionally want to replace it; uploading is not part of every repeat test. New participants are balanced among groups with an active set.

The local server applies pending database migrations before it starts. Render applies the same migrations automatically when its Docker service starts. Existing TREATMENT data is migrated to HIT-T; existing CONTROL data becomes LIT.

### 4. Complete a fresh participant visit

Open this in a private/incognito browser window:

```text
http://localhost:3001/?backend=postgres&timeframe=short
```

Use `timeframe=short` for the self-paced short test. Omit it (or use `timeframe=long`) for the long test. Create a new test participant and save the recovery code shown during enrollment. Complete the visit and confirm the response was saved; short-timeframe participants will immediately continue to the next study day.

The server locks a participant's completed study day until the next study window opens. With the current local quick-test setting, that means one hour per study day. To repeat a Day 1 visit immediately, create a new test participant in a fresh private window.

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

Use this path when you or a participant will test from another computer or phone over the internet. **Render runs the hosted app and connects it to Neon; you do not need to start Rancher Desktop, Docker Compose, or `npm run dev` in VS Code for a cloud test.** VS Code is still needed when you edit files, commit, and push updates to GitHub. Local and cloud databases are separate.

### 1. Deploy the latest code (only after code changes)

If you changed the app in VS Code, commit and push those changes to the GitHub branch connected to Render. In Render, open the `puppy-study-platform` web service and wait for its latest deploy to show **Live**. Check the deploy log for successful database migrations. If you have not changed code since the last successful deploy, you can skip this step.

### 2. Copy the real Render service URL

In the Render Dashboard, open the web service and copy its **Service URL**. Do not type the example text `YOUR-SERVICE` literally. For example, if Render shows `https://puppy-study-platform.onrender.com`, use that exact base URL in the steps below. Your assigned URL may differ.

Check the hosted API and database:

```text
<YOUR-REAL-RENDER-URL>/api/health
```

Continue when the result reports `"database":"connected"`.

### 3. Prepare the cloud trial order

Open `<YOUR-REAL-RENDER-URL>/admin` and sign in with the Render `ADMIN_PASSWORD`. Confirm that a trial-order set is active. If none is listed, upload the AllVersions CSV here and click **Validate and activate**. Uploading the CSV to `localhost:3001/admin` only changes the local database; it does not upload the file to Neon.

### 4. Run a cloud participant test

Open this URL in a private/incognito window, using the same real Render base URL:

```text
<YOUR-REAL-RENDER-URL>/?backend=postgres&timeframe=short
```

Use the URL above for the self-paced Short timeframe; use `<YOUR-REAL-RENDER-URL>/?backend=postgres` for Long, which advances one calendar day at a time. Both links use the same Render service, Neon database, and researcher admin. Timeframe is stored on the participant and cannot be changed by opening the other link later. Create a new synthetic test participant, save the recovery code, and finish the visit. Short participants can continue immediately; Long participants return on the next calendar day. A participant enrolled before a trial order was activated is not automatically assigned one; create a fresh test participant after activation.

To install the cloud trial on a phone's Home Screen, first open the participant URL after the latest deployment is Live, then use the browser's **Add to Home Screen** action. The participant timeframe is saved with the participant record and remains the same when restored with its recovery code.

### 5. Review registrations and answers

Return to `<YOUR-REAL-RENDER-URL>/admin` and sign in. Use the **Study timeframe** filter to view Short or Long participants and their responses; HIT-T/HIT-A/LIT treatment groups remain separate. The participant list and response CSV include timeframe. Registration appears when the participant record is created; a daily answer appears only after a successful end-of-day submission.

These records are stored in the Neon cloud database, not the local PostgreSQL container. Local Prisma Studio usually reads the database in `backend/.env`; it will not show cloud records unless explicitly configured for Neon. A free Render service may take about a minute to wake after inactivity. Use synthetic test data in staging.

Render Free web services spin down after 15 minutes without inbound traffic and wake when the next request arrives. There is no Free setting that keeps the service continuously running; paid compute plans stay on and incur a recurring compute charge. Check [Render's current pricing](https://render.com/pricing) before changing plans. See [Render's Free service limits](https://render.com/docs/free).

## Quick Troubleshooting

| Symptom | Check |
| --- | --- |
| `localhost:3001` does not open | Confirm the `npm run dev` terminal is still running. |
| Local health check reports a database error | Confirm Rancher Desktop is running and `docker compose ps` shows PostgreSQL as healthy. |
| 鈥淣o trial order is active鈥?| Sign in to `/admin`, activate a valid trial-order CSV, then enroll a new participant. |
| A participant is locked for today | Use a new test participant in a fresh private/incognito window. |
| Browser says `DNS_PROBE_FINISHED_NXDOMAIN` for `your-service.onrender.com` | `your-service` was example text. Copy the actual **Service URL** from the Render Dashboard and use it as the base URL. |
| Cloud health check fails | Check that the Render service is **Live**, confirm you copied the actual **Service URL**, and inspect its latest deploy/runtime logs. |
| Cloud page is slow on first open | The free Render service may be waking from idle; wait and refresh once. |

Do not share participant recovery codes, passwords, or database connection strings in screenshots or chat.



