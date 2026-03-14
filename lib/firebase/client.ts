import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function readEnv(name: string) {
  return process.env[name];
}

export const firebaseConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  measurementId: readEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

if (!isFirebaseConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    "[firebase] Missing one or more NEXT_PUBLIC_FIREBASE_* variables. Client services will stay disabled until they are set.",
  );
}

function initializeFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseApp = initializeFirebaseApp();
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null;

export function getFirebaseConfigError() {
  return "Firebase client is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables.";
}
