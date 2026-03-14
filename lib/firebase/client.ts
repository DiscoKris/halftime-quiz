import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
    "[firebase] Missing one or more NEXT_PUBLIC_FIREBASE_* variables. Client services will not initialize correctly until they are set.",
  );
}

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
