// Legacy Firebase imports kept for Firestore compatibility only
// Authentication has been replaced with JWT-based backend auth

import { initializeFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import configParams from "../../firebase-applet-config.json";

export const firebaseConfig = configParams;

const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific transport adjustments to handle iframe environment limitations
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

