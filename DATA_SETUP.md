# Puppy App data setup

## Current state

The app can run in local prototype mode. Its `localStorage` state is device-local and is not research storage. The Firebase client stays disabled until `firebase-config.js` contains a registered Firebase web-app configuration. Do not use real participant data until the study team has approved the storage plan.

## Local PostgreSQL trial capture

The README-based backend can also capture a local practice trial. This is separate from Firebase and is meant only for your own dummy data while developing.

1. Make sure `backend/.env` has `NODE_ENV=development` and `PUPPY_LOCAL_TRIAL_CAPTURE=true`.
2. Start the database with `docker compose up -d` and start the API with `npm run dev` from the project root.
3. Open `http://localhost:3001/?backend=postgres` on this computer. On a phone on the same Wi-Fi, replace `localhost` with this computer's private IPv4 address.
4. Finish a daily trial. Its participant profile and response will be stored in PostgreSQL.
5. Run `npm run db:studio` from the project root to browse the `Participant` and `DailyResponse` tables.

The local trial API has no participant sign-in yet. It is disabled unless `NODE_ENV=development` and `PUPPY_LOCAL_TRIAL_CAPTURE=true`; do not deploy with those settings or use it for real participants.

## Firebase services

1. Create a Firebase project and register a Web App.
2. Enable the **Anonymous** authentication provider. The recovery flow signs participants in with a custom token returned by the server.
3. Create a Cloud Firestore database.
4. Choose the Blaze plan before deploying Cloud Functions. Functions require a billing account; the project may still incur charges. Configure budget alerts and review current Firebase pricing first.
5. Copy the Web App config into `firebase-config.js`. Keep `dataCollectionEnabled: false` while developing. Enable it only after the approved consent flow, schedule, and data-handling plan are in place.
6. Deploy Firestore rules and functions from this repository with the Firebase CLI.
7. Add the GitHub Pages hostname to Firebase Authentication's authorized domains. Configure Firebase App Check before broad participant access.

From the repository root, install the Firebase CLI, sign in, select the project, and deploy the rules and server functions:

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,functions
```

## Data model

- `participants/{authUid}`: pseudonymous profile and study status.
- `participants/{authUid}/days/{01..24}`: one response per study day, with the mood prediction, interaction completion, study date, and server timestamp.
- `recoveryCodes/{sha256(code)}`: server-only mapping from a high-entropy recovery code to an auth UID. The raw recovery code is returned once and must be saved by the participant.
- `puppyNames/{sha256(normalizedDisplayName)}`: server-only reservation used to suffix duplicate display names.

The client cannot write Firestore documents directly. Callable Cloud Functions authenticate the participant, validate responses, and create records. Firestore rules deny client writes and restrict reads to the authenticated participant's own records.

## Important study limits

This first storage layer captures the mood response and whether each interaction was completed. It does not yet attach the actual T/A levels, outcome schedule, or randomized condition to the records. Those must be supplied from the finalized study schedule before collecting analyzable research data. The backend currently assumes a 24-day study and `America/New_York`; revise those values with the approved protocol before deployment.

A recovery code grants access to the participant account. The server stores only its SHA-256 digest, but the participant must keep the code private. Reissuing a code invalidates the previous one.




## Local simulation (no cloud project or billing)

The app supports Firebase Emulator Suite mode only on `localhost`/`127.0.0.1` when the URL includes `?emulator=1`. It uses the fixed `demo-puppy-study` project ID and connects Auth, Firestore, and Functions to local ports. The simulator never points at a real Firebase project.

Requirements: Node.js, Java JDK 11+, and Firebase CLI. Firebase documents the Emulator Suite as a local prototyping tool; its UI is available on port 4000 and shows Auth accounts, Firestore documents, function logs, and rule request traces.

First run from the project root:

```powershell
npm install -g firebase-tools
npm --prefix functions install
npm run emulators:first-run
```

In a second PowerShell window, start the local PWA server:

```powershell
npm run serve
```

Open `http://127.0.0.1:8000/?emulator=1` for the app and `http://127.0.0.1:4000` for the Emulator UI. Create a test puppy, save the recovery code, complete a trial, and inspect `participants` in Firestore.

The first emulator session exports its test database to `.emulator-data` when stopped. Later sessions can restore it with `npm run emulators`. These test records stay on this computer and must never be submitted as research data.
