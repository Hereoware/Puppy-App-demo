# Puppy App: Step-by-Step Run and Test Guide

This guide starts from a Windows computer that has never started this project. It explains how to start Rancher Desktop, run the local PostgreSQL database and app, upload a trial order, complete a participant visit, and check the saved record.

> **This is a local development test.** The database runs on your computer. It is not the cloud database, and it is not approved for real participant data.

## What You Will Start

The local test uses three pieces:

1. **Rancher Desktop** runs a small Linux environment on your Windows computer. Inside it, Docker runs PostgreSQL in a **container** (a lightweight isolated environment for an app). Rancher Desktop must be running before `docker compose` can start PostgreSQL.
2. **PostgreSQL** is the local database. The project starts it with Docker Compose and keeps its data in a named volume (持久化存储卷).
3. **Puppy App** runs in Node.js. Its Express backend (server-side app) serves the web page and connects to PostgreSQL.

The browser page at `file:///.../index.html` is only a file preview. For this test, use the `http://localhost:3001/...` address served by Puppy App.

## Before You Begin

You need:

- The Puppy App project folder on this computer.
- Node.js and npm installed.
- Rancher Desktop installed and configured to use **dockerd (Moby)** as its container engine (容器引擎). This mode provides the Docker API used by the `docker` and `docker compose` commands.
- An internet connection the first time, so Docker can download the PostgreSQL image and npm can download project packages.

You do not need Kubernetes for this guide.

Rancher Desktop uses Windows Subsystem for Linux 2 (WSL 2) on Windows to run its Linux container environment. It is a local development tool; opening Rancher Desktop does not publish the app online. Rancher Desktop supports both `containerd` and `dockerd (Moby)`. This project uses Docker Compose, so select `dockerd (Moby)`. [Rancher Desktop: container engine](https://docs.rancherdesktop.io/ui/preferences/container-engine/general/) · [Rancher Desktop: Windows installation](https://docs.rancherdesktop.io/getting-started/installation/)

## Step 1 — Open Rancher Desktop

1. Open the Windows **Start** menu, search for **Rancher Desktop**, and launch it.
2. Wait for Rancher Desktop to finish starting. On its dashboard, wait until the container engine shows that it is running/ready. The first launch may take longer while it prepares WSL 2 and downloads components.
3. If Rancher Desktop asks which container engine to use, choose **dockerd (Moby)**. If you need to change it later, open Rancher Desktop **Preferences → Container Engine → General**, select **dockerd (Moby)**, and wait for it to restart.
4. Keep Rancher Desktop open while using the local database. Closing it stops the local container engine, so the database will no longer be available until Rancher Desktop starts again.

### Confirm Rancher Desktop Is Ready

Open a **new VS Code PowerShell terminal** and run:

```powershell
docker --version
docker compose version
docker info
```

The first two commands should print version numbers. `docker info` should show both **Client** and **Server** information. If it says it cannot connect to `docker_engine` or `docker API`, the engine is not ready: return to Rancher Desktop, wait for it to finish starting, and run `docker info` again. If `docker` is not recognized, check the Rancher Desktop container-engine setting and its Docker CLI support utility.

## Step 2 — Open the Project Folder in VS Code

In VS Code, open the folder named **Puppy App!** (not just one HTML file). Open **Terminal → New Terminal** and confirm the prompt ends with the project folder, for example:

```text
C:\Users\21683\OneDrive - University of Pittsburgh\Documents\ChatGPT\Puppy App!
```

If the terminal is in a different folder, run:

```powershell
cd "C:\Users\21683\OneDrive - University of Pittsburgh\Documents\ChatGPT\Puppy App!"
```

Check that Node.js and npm are available:

```powershell
node --version
npm --version
```
npm（Node Package Manager） 是 Node.js 自带的包管理器

If either command is not recognized, install Node.js, restart VS Code, and repeat this step.

## Step 3 — Prepare the Local Environment File

The backend reads local settings from `backend/.env`. This file is private and must not be uploaded to GitHub.

If `backend/.env` does not exist, create it from the example:

```powershell
if (!(Test-Path "backend/.env")) { Copy-Item "backend/.env.example" "backend/.env" }
```

For the local test, the example file uses a local-only database URL and local-only researcher password. Do not reuse these values on a public server. If `backend/.env` already exists, keep it; do not overwrite it just to follow this step. Confirm that it contains `NODE_ENV=development` and `PUPPY_LOCAL_TRIAL_CAPTURE=true`; add either line from `.env.example` if it is missing.

## Step 4 — Start the PostgreSQL Container

Run this from the project root (the folder that contains `docker-compose.yml`):

```powershell
docker compose up -d
```

On the first run, Docker downloads the PostgreSQL image. The `-d` option starts it in the background so you can keep using the terminal.

Check its status:

```powershell
docker compose ps
```

Wait until the `postgres` service is running and its health status is `healthy`. It can take a few seconds. The database is available only on this computer at `localhost:5432`.

The database uses a named Docker volume, so stopping the container does not normally erase its local test data. Do not run `docker compose down -v` unless you intend to delete that volume and its data.

## Step 5 — Install Backend Packages and Create the Tables

In the same terminal, run:

```powershell
npm --prefix backend ci
npm --prefix backend run db:migrate
```

These commands install the exact backend package versions and apply the SQL migrations (database structure updates), then generate the Prisma Client. They operate on the local database configured in `backend/.env`.

If migration fails, confirm Rancher Desktop is ready, `docker compose ps` reports a healthy PostgreSQL service, and `backend/.env` has the same local database address/user/password as `docker-compose.yml`.

## Step 6 — Start the Puppy App Backend

From the project root, run:

```powershell
npm run dev
```

Keep this terminal open. It runs the web server and API; closing the terminal stops Puppy App. A message similar to `Puppy Study API listening on http://localhost:3001` means the server started.

Open this health check in a browser:

```text
http://localhost:3001/api/health
```

Expected result:

```json
{"ok":true,"database":"connected"}
```

If the page cannot open, check that the backend terminal is still running. If it reports a database error, return to Step 4 and check `docker compose ps`.

## Step 7 — Sign In to the Local Researcher Page

Open this URL in the browser:

```text
http://localhost:3001/admin
```

The local example password is `puppy-local-admin`, unless `ADMIN_PASSWORD` in your private `backend/.env` sets another value. This is a development password only. Do not use it for an online service.

After login, you should see the trial-order upload and current trial-order list. The administrator page must be opened through `localhost:3001`; opening `admin.html` as a `file:///` URL does not connect it to the backend.

## Step 8 — Upload a Trial Order

1. In the local admin page, click the CSV file selector.
2. In the project folder, select:

   ```text
   trial-orders/T12-AllVersions.csv
   ```

3. Wait for the validation preview. For the supplied file, it should report **30 versions**, each with **24 days**.
4. Keep or edit the trial-order set name and enter a category (for example, `Main study`, `Pilot`, or `Backup`), then click **验证并启用** (Validate and activate).
5. Confirm the success message and check that the new set appears as active in the list.

The signed-in researcher page also lets you filter sets by category, change a set's name/category, or activate an older set for **new participants**. Existing participants keep their assigned version. A set cannot be deleted while it is active or while any participants are assigned to one of its versions; activate a different set first, and preserve assigned sets so participant records remain interpretable.

The importer expects the columns `version`, `day`, `T`, `A`, `E`, `T_label`, and `A_label`. Each version must contain days 1–24 once; T and A must be 0 or 1; E must be an integer from -1 to 10.

The CSV is a local file selection; it does not need to be copied into the Docker container or committed to GitHub. A successful upload activates this order set for **new participants**. Participants already enrolled keep their existing assigned version.

## Step 9 — Run a Participant Visit

Open the participant app at:

```text
http://localhost:3001/?backend=postgres
```

Do not use the `file:///.../index.html` preview or the GitHub Pages URL for this database test.

1. Choose a language and create a test puppy/participant.
2. Save the recovery code shown after enrollment. It is needed to restore this participant later. When you restore with the code, the server rotates it and shows a replacement code; save the new code too.
3. Continue through the environment introduction.
4. Complete both interactions: move the food into the bowl and complete the activity. Each interaction is designed to take about eight seconds.
5. Select a predicted E score from -1 to 10, continue through the displayed outcome, and finish the visit.
6. Confirm that the app shows today’s visit as complete. Refresh the page or reopen the same URL: it should remain locked for today.

The server assigns a trial-order version randomly at enrollment and only returns the trial for the participant’s current study day. The local server uses the actual calendar date; there is no “next day” simulation button in this database flow. To check a fresh enrollment on Day 1, use a new private/incognito browser window and create a separate test participant. Do not edit database dates to imitate a participant.

## Step 10 — Check the Saved Database Record

Open a **second** PowerShell terminal in the project root. Leave the backend terminal and Rancher Desktop running. Start Prisma Studio:

```powershell
npm run db:studio
```

Open the local address printed in that terminal, usually:

```text
http://localhost:5555
```

Check these tables:

- `Participant`: the test participant and its assigned trial-order version.
- `TrialOrderSet`: the uploaded set and whether it is active.
- `TrialOrderVersion`: the versions included in that set.
- `DailyResponse`: the saved study day, predicted E, actual E, T/A values, interaction flags, and timestamps.

Close Prisma Studio with **Ctrl+C** in its terminal when finished.

## Step 11 — Stop the Local Test

1. In the backend terminal, press **Ctrl+C** to stop Puppy App.
2. In a terminal at the project root, run:

   ```powershell
   docker compose stop
   ```

This stops PostgreSQL but keeps the named volume and local test data. The next time you test, open Rancher Desktop again, run `docker compose up -d`, and restart the backend. Avoid `docker compose down -v`; `-v` removes the database volume and its contents.

## What Each URL Is For

| URL | What it does | Uses PostgreSQL? |
|---|---|---:|
| `file:///.../index.html` | Opens a local file preview | No |
| `http://localhost:3001/?backend=postgres` | Local participant flow served by the backend | Yes, local database |
| `http://localhost:3001/admin` | Local researcher login and trial-order upload | Yes, local database |
| `https://hereoware.github.io/Puppy-App-demo/` | Public static GitHub Pages preview | No |
| `https://YOUR-SERVICE.onrender.com/?backend=postgres` | Cloud staging participant flow, after Render is configured | Yes, cloud test database |

GitHub Pages publishes static files only. It does not run Node.js or PostgreSQL. Pushing code to GitHub does not by itself create a cloud backend/database.

## Optional — Test from a Phone on the Same Wi-Fi

For a short local check, connect the phone and computer to the same Wi-Fi. Find the computer’s Wi-Fi IPv4 address using `ipconfig`, then open:

```text
http://COMPUTER-IP-ADDRESS:3001/?backend=postgres
```

For example: `http://192.168.1.23:3001/?backend=postgres`. The backend computer, Rancher Desktop, and PostgreSQL must stay running. Windows Firewall may ask whether Node.js can accept connections on a private network. This HTTP address is for local testing; use HTTPS for an online PWA.

## Troubleshooting

### `failed to connect to the docker API` or `docker_engine` does not exist

Rancher Desktop’s container engine is not running yet. Open Rancher Desktop, wait for it to finish starting, confirm **dockerd (Moby)** is selected, then run `docker info`. Retry `docker compose up -d` only after `docker info` shows Server information.

### `docker compose` is not recognized

Check Rancher Desktop’s container-engine setting and Docker CLI integration. Confirm `docker compose version` works in a newly opened VS Code terminal.

### PostgreSQL is not healthy or port 5432 is already in use

Run `docker compose ps`. If another PostgreSQL service is already using port 5432, stop that service or ask for help before changing the project port and database URL.

### `npm --prefix backend run db:migrate` cannot connect

Confirm the PostgreSQL container is healthy and the `DATABASE_URL` in `backend/.env` points to `localhost:5432/puppy_study` with the local credentials from `docker-compose.yml`. Keep the full URL private.

### The admin page or participant page is blank / shows a file URL

Open the exact `http://localhost:3001/...` URL above, and confirm `npm run dev` is still running. Do not double-click `index.html` or `admin.html` for the database-backed workflow.

### Admin login fails

For local development, check `ADMIN_PASSWORD` in `backend/.env`. If it is not set, the local fallback is `puppy-local-admin`. Restart `npm run dev` after changing `.env`.

### There is no active trial order

Sign in at `http://localhost:3001/admin`, upload a valid AllVersions CSV, and confirm the upload success message. Then create a new participant; existing participants do not get reassigned.

## Optional — Automated Importer Checks

The following command runs the project’s automated tests. They check CSV parsing and validation; they are not a full browser/database test:

```powershell
npm test
```

## Hosted Participant Test — Render and Neon

Use this flow when participants are on another computer or phone over the internet. Replace `YOUR-SERVICE` with the Render service name shown in your Render dashboard.

1. Commit and push the latest project changes to the GitHub branch connected to Render. Wait until the Render service reports **Live**. Check deploy logs for `prisma migrate deploy` completing successfully; this applies new database migrations such as the trial-order category column.
2. Check `https://YOUR-SERVICE.onrender.com/api/health`. It should return `{"ok":true,"database":"connected"}`.
3. Open `https://YOUR-SERVICE.onrender.com/admin` and sign in with Render's `ADMIN_PASSWORD`. Upload and activate the AllVersions CSV **in this hosted admin page**. A CSV uploaded to `localhost:3001/admin` is stored in the local database and is not copied to Neon.
4. Give participants this URL: `https://YOUR-SERVICE.onrender.com/?backend=postgres`. It must be the Render URL with `?backend=postgres`; `localhost` is only reachable from your own computer, and GitHub Pages is a static preview that does not submit to this PostgreSQL backend.
5. In the same hosted `/admin` page, refresh **参与者注册** to see registrations (ID, puppy name, enrollment time, status, assigned version, and number of submitted days). Refresh **参与者回答** to see each saved daily response. Enrollment appears when a participant record is created; an answer appears only after the participant finishes the daily flow, submits it, and the page confirms it was saved.

Prisma Studio at `localhost:49152` reads the database in the local `backend/.env`; it will not show Neon rows unless deliberately configured with the cloud connection. Keep database credentials private. Render Free can sleep after 15 minutes without a request, so a participant's first request may wait for the service to wake.
