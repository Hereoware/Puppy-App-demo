// Local-only Firebase Emulator configuration. The demo project ID prevents accidental cloud access.
const puppyQuery = new URLSearchParams(window.location.search);
const puppyLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const puppyEmulatorMode = puppyLocalHost && puppyQuery.get("emulator") === "1";
window.PUPPY_FIREBASE_CONFIG = {
  apiKey: puppyEmulatorMode ? "demo-api-key" : "",
  authDomain: puppyEmulatorMode ? "localhost" : "",
  projectId: puppyEmulatorMode ? "demo-puppy-study" : "",
  appId: puppyEmulatorMode ? "demo-app-id" : "",
  dataCollectionEnabled: false,
  emulatorMode: puppyEmulatorMode
};
