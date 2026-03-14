import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";
import { COLLECTIONS, type CollectionName } from "./constants";
import { db, getFirebaseConfigError } from "./firebase/client";
import type { FirestoreDateValue } from "../types/domain";

function getRequiredDb() {
  if (!db) {
    throw new Error(getFirebaseConfigError());
  }

  return db;
}

export function collectionRef<T = DocumentData>(
  collectionName: CollectionName,
): CollectionReference<T> {
  return collection(getRequiredDb(), collectionName) as CollectionReference<T>;
}

export function documentRef<T = DocumentData>(
  collectionName: CollectionName,
  documentId: string,
): DocumentReference<T> {
  return doc(getRequiredDb(), collectionName, documentId) as DocumentReference<T>;
}

export function eventQuestionsCollectionRef<T = DocumentData>(eventId: string) {
  return collection(
    getRequiredDb(),
    COLLECTIONS.events,
    eventId,
    COLLECTIONS.eventQuestions,
  ) as CollectionReference<T>;
}

export function withId<T extends object>(id: string, value: T): T & { id: string } {
  return { id, ...value };
}

export function toDate(value: FirestoreDateValue): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const normalized = new Date(value);
    return Number.isNaN(normalized.getTime()) ? null : normalized;
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  return null;
}

export function toDateOrUndefined(value: FirestoreDateValue) {
  return toDate(value) ?? undefined;
}

export function toIsoString(value: FirestoreDateValue) {
  const normalized = toDate(value);
  return normalized ? normalized.toISOString() : undefined;
}
