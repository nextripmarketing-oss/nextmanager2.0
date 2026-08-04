import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Agency, PassportLog } from "../types/agency";

const AGENCIES_COLLECTION = "agencies";
const PASSPORT_LOGS_COLLECTION = "passport_logs";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as any;
  }
  if (data !== null && typeof data === "object") {
    const proto = Object.getPrototypeOf(data);
    if (proto === null || proto === Object.prototype) {
      const cleaned: any = {};
      for (const key of Object.keys(data as any)) {
        const val = (data as any)[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeForFirestore(val);
        }
      }
      return cleaned as T;
    }
  }
  return data;
}

export const AgencyService = {
  // 1. Agency Master Profile Actions
  async addAgency(agency: Omit<Agency, "id" | "createdAt" | "updatedAt">) {
    try {
      const cleaned = sanitizeForFirestore({
        ...agency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return await addDoc(collection(db, AGENCIES_COLLECTION), cleaned);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, AGENCIES_COLLECTION);
    }
  },

  async updateAgency(id: string, updates: Partial<Agency>) {
    try {
      const docRef = doc(db, AGENCIES_COLLECTION, id);
      const cleaned = sanitizeForFirestore({
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return await updateDoc(docRef, cleaned);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `${AGENCIES_COLLECTION}/${id}`,
      );
    }
  },

  async deleteAgency(id: string) {
    try {
      const docRef = doc(db, AGENCIES_COLLECTION, id);
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `${AGENCIES_COLLECTION}/${id}`,
      );
    }
  },

  subscribeToAgencies(callback: (agencies: Agency[]) => void) {
    const q = query(collection(db, AGENCIES_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const agencies = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Agency[];

        // Sort in-memory asc by name
        agencies.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        callback(agencies);
      },
      (error) => {
        console.warn("Firestore agencies subscription error:", error);
        callback([]);
      },
    );
  },

  // 2. Passport Movement Log Actions
  async addPassportLog(log: Omit<PassportLog, "id" | "createdAt">) {
    try {
      const cleaned = sanitizeForFirestore({
        ...log,
        createdAt: serverTimestamp(),
      });
      return await addDoc(collection(db, PASSPORT_LOGS_COLLECTION), cleaned);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        PASSPORT_LOGS_COLLECTION,
      );
    }
  },

  async updatePassportLog(id: string, updates: Partial<PassportLog>) {
    try {
      const docRef = doc(db, PASSPORT_LOGS_COLLECTION, id);
      const cleaned = sanitizeForFirestore(updates);
      return await updateDoc(docRef, cleaned);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `${PASSPORT_LOGS_COLLECTION}/${id}`,
      );
    }
  },

  async deletePassportLog(id: string) {
    try {
      const docRef = doc(db, PASSPORT_LOGS_COLLECTION, id);
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `${PASSPORT_LOGS_COLLECTION}/${id}`,
      );
    }
  },

  subscribeToPassportLogs(callback: (logs: PassportLog[]) => void) {
    const q = query(collection(db, PASSPORT_LOGS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PassportLog[];

        // Sort in-memory desc by date
        logs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

        callback(logs);
      },
      (error) => {
        console.warn("Firestore passport logs subscription error:", error);
        callback([]);
      },
    );
  },
};
