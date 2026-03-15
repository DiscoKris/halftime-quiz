import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const REQUIRED_FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const OPTIONAL_FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
] as const;

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

function getMissingEnvKeys(keys: readonly string[]) {
  return keys.filter((key) => {
    const value = readEnv(key);
    return typeof value !== "string" || value.trim() === "";
  });
}

export const missingRequiredFirebaseEnvKeys = getMissingEnvKeys(REQUIRED_FIREBASE_ENV_KEYS);
export const missingOptionalFirebaseEnvKeys = getMissingEnvKeys(OPTIONAL_FIREBASE_ENV_KEYS);

export const isFirebaseConfigured = missingRequiredFirebaseEnvKeys.length === 0;

if (!isFirebaseConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    `[firebase] Missing required Firebase env vars: ${missingRequiredFirebaseEnvKeys.join(", ")}.`,
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
  const missingKeys = [
    ...missingRequiredFirebaseEnvKeys,
    ...missingOptionalFirebaseEnvKeys.map((key) => `${key} (optional)`),
  ];

  if (missingKeys.length === 0) {
    return "Firebase client is not configured. Required Firebase env vars are present, so verify the deployed build is current.";
  }

  return `Firebase client is not configured. Missing Firebase env vars: ${missingKeys.join(", ")}.`;
}
