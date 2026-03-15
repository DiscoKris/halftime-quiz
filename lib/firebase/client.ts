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

const PUBLIC_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

const FIREBASE_ENV_SHAPE_CHECKS = {
  NEXT_PUBLIC_FIREBASE_API_KEY: (value: string) => value.length > 20,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: (value: string) =>
    /^[^.]+\.firebaseapp\.com$/i.test(value),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: (value: string) =>
    /^[a-z0-9-]+$/i.test(value),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: (value: string) =>
    /\.(appspot\.com|firebasestorage\.app)$/i.test(value),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: (value: string) =>
    /^\d+$/.test(value),
  NEXT_PUBLIC_FIREBASE_APP_ID: (value: string) =>
    /^1:\d+:web:[a-z0-9]+$/i.test(value),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: (value: string) =>
    /^G-[A-Z0-9]+$/i.test(value),
} as const;

function readEnv(name: string) {
  return PUBLIC_ENV[name as keyof typeof PUBLIC_ENV];
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

function getMalformedEnvKeys(keys: readonly string[]) {
  return keys.filter((key) => {
    const value = readEnv(key);

    if (typeof value !== "string" || value.trim() === "") {
      return false;
    }

    const validateShape = FIREBASE_ENV_SHAPE_CHECKS[key as keyof typeof FIREBASE_ENV_SHAPE_CHECKS];
    return validateShape ? !validateShape(value.trim()) : false;
  });
}

export const missingRequiredFirebaseEnvKeys = getMissingEnvKeys(REQUIRED_FIREBASE_ENV_KEYS);
export const missingOptionalFirebaseEnvKeys = getMissingEnvKeys(OPTIONAL_FIREBASE_ENV_KEYS);
export const malformedRequiredFirebaseEnvKeys = getMalformedEnvKeys(REQUIRED_FIREBASE_ENV_KEYS);
export const malformedOptionalFirebaseEnvKeys = getMalformedEnvKeys(OPTIONAL_FIREBASE_ENV_KEYS);

export const isFirebaseConfigured =
  missingRequiredFirebaseEnvKeys.length === 0 &&
  malformedRequiredFirebaseEnvKeys.length === 0;

export const firebaseEnvDiagnostics = {
  missingRequired: missingRequiredFirebaseEnvKeys,
  missingOptional: missingOptionalFirebaseEnvKeys,
  malformedRequired: malformedRequiredFirebaseEnvKeys,
  malformedOptional: malformedOptionalFirebaseEnvKeys,
} as const;

if (!isFirebaseConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    `[firebase] Firebase env diagnostics: missing required [${missingRequiredFirebaseEnvKeys.join(", ")}], malformed required [${malformedRequiredFirebaseEnvKeys.join(", ")}].`,
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
  const issues = [
    ...missingRequiredFirebaseEnvKeys,
    ...missingOptionalFirebaseEnvKeys.map((key) => `${key} (optional)`),
    ...malformedRequiredFirebaseEnvKeys.map((key) => `${key} (malformed)`),
    ...malformedOptionalFirebaseEnvKeys.map((key) => `${key} (optional malformed)`),
  ];

  if (issues.length === 0) {
    return "Firebase client is not configured. Required Firebase env vars are present, so verify the deployed build is current.";
  }

  return `Firebase client is not configured. Firebase env issues: ${issues.join(", ")}.`;
}
