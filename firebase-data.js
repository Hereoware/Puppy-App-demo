import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInAnonymously, signInWithCustomToken, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-functions.js";

const config = window.PUPPY_FIREBASE_CONFIG;
if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.appId) {
  throw new Error("Firebase is not configured. Add the Firebase web-app values to firebase-config.js.");
}
const app = getApps().length ? getApps()[0] : initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "us-east1");
if (config.emulatorMode) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
let initialized = false;

async function ready() {
  if (!initialized) {
    await setPersistence(auth, browserLocalPersistence);
    await auth.authStateReady();
    initialized = true;
  }
}
async function ensureAnonymousUser() {
  await ready();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}
async function participantProfile(uid) {
  const snapshot = await getDoc(doc(db, "participants", uid));
  return snapshot.exists() ? snapshot.data() : null;
}
export async function resumeParticipant() {
  await ready();
  if (!auth.currentUser) return null;
  const profile = await participantProfile(auth.currentUser.uid);
  return profile ? { uid: auth.currentUser.uid, ...profile } : null;
}
export async function enrollParticipant(puppyName) {
  const user = await ensureAnonymousUser();
  const result = await httpsCallable(functions, "enrollParticipant")({ puppyName });
  return { uid: user.uid, ...result.data };
}
export async function issueRecoveryCode() {
  await ready();
  if (!auth.currentUser) throw new Error("Sign in before creating a recovery code.");
  const result = await httpsCallable(functions, "issueRecoveryCode")({});
  return result.data.recoveryCode;
}
export async function recoverParticipant(recoveryCode) {
  await ready();
  const result = await httpsCallable(functions, "recoverParticipant")({ recoveryCode });
  await signInWithCustomToken(auth, result.data.customToken);
  const profile = await participantProfile(auth.currentUser.uid);
  if (!profile) throw new Error("The recovered participant profile was not found.");
  return { uid: auth.currentUser.uid, ...profile };
}
export async function submitDailyResponse(payload) {
  await ready();
  if (!auth.currentUser) throw new Error("Participant sign-in is required before saving responses.");
  const result = await httpsCallable(functions, "submitDailyResponse")(payload);
  return result.data;
}

