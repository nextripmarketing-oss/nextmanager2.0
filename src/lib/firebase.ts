// Firebase client setup. Primary authentication is JWT-based (see src/lib/auth.ts);
// `auth` and `storage` are still exported because services import them.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import configParams from "../../firebase-applet-config.json";

export const firebaseConfig = configParams;

const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific transport adjustments to handle iframe environment limitations
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

export const auth = getAuth(app);
export const storage = getStorage(app);
