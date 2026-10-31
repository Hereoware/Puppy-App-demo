const crypto = require("node:crypto");
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

admin.initializeApp();
setGlobalOptions({ region: "us-east1", maxInstances: 5 });
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
const STUDY_TIME_ZONE = "America/New_York";
const MAX_STUDY_DAYS = 24;

function requireAuth(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Participant sign-in is required.");
  return request.auth.uid;
}
function todayInStudyZone() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: STUDY_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function dayNumber(enrolledOn, today) {
  const start = Date.parse(`${enrolledOn}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  return Math.floor((current - start) / 86400000) + 1;
}
function normalizedName(name) {
  return name.trim().normalize("NFKC").replace(/\s+/g, " ");
}
function nameKey(name) {
  return crypto.createHash("sha256").update(name.toLocaleLowerCase("en-US")).digest("hex");
}
function makeRecoveryCode() {
  return crypto.randomBytes(16).toString("hex").toUpperCase().match(/.{1,4}/g).join("-");
}
function recoveryDigest(code) {
  const normalized = String(code || "").replace(/[^a-f0-9]/gi, "").toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
async function rotateRecoveryCode(uid) {
  const recoveryCode = makeRecoveryCode();
  const digest = recoveryDigest(recoveryCode);
  const participantRef = db.doc(`participants/${uid}`);
  const recoveryRef = db.doc(`recoveryCodes/${digest}`);
  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(participantRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "Participant profile not found.");
    const previousDigest = snapshot.get("recoveryDigest");
    if (previousDigest) tx.delete(db.doc(`recoveryCodes/${previousDigest}`));
    tx.create(recoveryRef, { uid, createdAt: FieldValue.serverTimestamp() });
    tx.update(participantRef, { recoveryDigest: digest, recoveryCodeUpdatedAt: FieldValue.serverTimestamp() });
  });
  return recoveryCode;
}

exports.enrollParticipant = onCall(async (request) => {
  const uid = requireAuth(request);
  const puppyName = normalizedName(String(request.data?.puppyName || ""));
  if (!puppyName || puppyName.length > 24) {
    throw new HttpsError("invalid-argument", "Puppy name must be 1–24 characters.");
  }
  const participantRef = db.doc(`participants/${uid}`);
  const enrolledOn = todayInStudyZone();
  let profile;
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(participantRef);
    if (existing.exists) {
      profile = existing.data();
      return;
    }
    let displayName = puppyName;
    let suffix = 0;
    let nameRef;
    while (suffix < 10000) {
      nameRef = db.doc(`puppyNames/${nameKey(displayName)}`);
      const reservation = await tx.get(nameRef);
      if (!reservation.exists) break;
      suffix += 1;
      displayName = `${puppyName}${suffix}`;
    }
    if (suffix >= 10000) throw new HttpsError("resource-exhausted", "Could not allocate a unique puppy name.");
    tx.create(nameRef, { uid, createdAt: FieldValue.serverTimestamp() });
    profile = {
      puppyName: displayName,
      enrolledOn,
      timeZone: STUDY_TIME_ZONE,
      nextStudyDay: 1,
      lastSubmittedDate: null,
      status: "active",
      createdAt: FieldValue.serverTimestamp()
    };
    tx.create(participantRef, profile);
  });
  const recoveryCode = await rotateRecoveryCode(uid);
  const { recoveryDigest, ...safeProfile } = profile;
  return { ...safeProfile, recoveryCode };
});

exports.issueRecoveryCode = onCall(async (request) => {
  const uid = requireAuth(request);
  const recoveryCode = await rotateRecoveryCode(uid);
  return { recoveryCode };
});

exports.recoverParticipant = onCall(async (request) => {
  const digest = recoveryDigest(request.data?.recoveryCode);
  if (digest.length !== 64 || /^0+$/.test(digest)) {
    throw new HttpsError("invalid-argument", "Enter a valid recovery code.");
  }
  const recoverySnapshot = await db.doc(`recoveryCodes/${digest}`).get();
  if (!recoverySnapshot.exists) throw new HttpsError("not-found", "Recovery code not recognized.");
  const uid = recoverySnapshot.get("uid");
  const participant = await db.doc(`participants/${uid}`).get();
  if (!participant.exists || participant.get("status") !== "active") {
    throw new HttpsError("permission-denied", "This participant account is not active.");
  }
  return { customToken: await admin.auth().createCustomToken(uid) };
});

exports.submitDailyResponse = onCall(async (request) => {
  const uid = requireAuth(request);
  const { studyDay, moodPrediction, interactions, requestId } = request.data || {};
  if (!Number.isInteger(studyDay) || studyDay < 1 || studyDay > MAX_STUDY_DAYS) {
    throw new HttpsError("invalid-argument", "Invalid study day.");
  }
  if (!["happy", "sad"].includes(moodPrediction)) {
    throw new HttpsError("invalid-argument", "Invalid mood response.");
  }
  if (typeof requestId !== "string" || requestId.length < 8 || requestId.length > 80) {
    throw new HttpsError("invalid-argument", "Invalid submission identifier.");
  }
  if (typeof interactions?.fed !== "boolean" || typeof interactions?.played !== "boolean") {
    throw new HttpsError("invalid-argument", "Interaction completion is required.");
  }
  const participantRef = db.doc(`participants/${uid}`);
  const profileSnapshot = await participantRef.get();
  if (!profileSnapshot.exists || profileSnapshot.get("status") !== "active") {
    throw new HttpsError("permission-denied", "Participant account is not active.");
  }
  const profile = profileSnapshot.data();
  const today = todayInStudyZone();
  const expectedDay = dayNumber(profile.enrolledOn, today);
  if (expectedDay > MAX_STUDY_DAYS || studyDay !== expectedDay) {
    throw new HttpsError("failed-precondition", "This response is not for the current study day.");
  }
  const previousDay = profile.lastSubmittedStudyDay || 0;
  if (studyDay - previousDay - 1 > 3) {
    await participantRef.update({ status: "terminated", terminatedAt: FieldValue.serverTimestamp() });
    throw new HttpsError("failed-precondition", "The missed-day limit has been reached.");
  }
  const dayRef = db.doc(`participants/${uid}/days/${String(studyDay).padStart(2, "0")}`);
  const result = await db.runTransaction(async (tx) => {
    const [existing, currentProfile] = await Promise.all([tx.get(dayRef), tx.get(participantRef)]);
    if (existing.exists) {
      if (existing.get("requestId") === requestId) return { saved: true, alreadySaved: true };
      throw new HttpsError("already-exists", "A response has already been saved for this study day.");
    }
    if (!currentProfile.exists || currentProfile.get("status") !== "active") {
      throw new HttpsError("permission-denied", "Participant account is not active.");
    }
    if (currentProfile.get("lastSubmittedDate") === today) {
      throw new HttpsError("already-exists", "A response has already been submitted today.");
    }
    tx.create(dayRef, {
      studyDay,
      studyDate: today,
      moodPrediction,
      interactions: { fed: interactions.fed, played: interactions.played },
      requestId,
      createdAt: FieldValue.serverTimestamp(),
      appVersion: "puppy-day-v3"
    });
    tx.update(participantRef, {
      nextStudyDay: studyDay + 1,
      lastSubmittedDate: today,
      lastSubmittedStudyDay: studyDay,
      lastSubmittedAt: FieldValue.serverTimestamp()
    });
    return { saved: true, alreadySaved: false };
  });
  return result;
});



