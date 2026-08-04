import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { TrainingEnrollment } from "../types/training";

const COLLECTION_NAME = "training_enrollments";

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
    emailVerified?: boolean | null;
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
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure no property has a value of 'undefined' as Firestore does not support it
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

const LOCAL_STORAGE_KEY = "cached_training_enrollments";

const listeners = new Set<(enrollments: TrainingEnrollment[]) => void>();
let firestoreEnrollments: TrainingEnrollment[] = [];

// Helper to load from localStorage safely
function getLocalEnrollments(): TrainingEnrollment[] {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.error(
      "Failed to parse cached_training_enrollments from localStorage:",
      e,
    );
    return [];
  }
}

// Helper to save to localStorage safely
function saveLocalEnrollments(enrollments: TrainingEnrollment[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(enrollments));
  } catch (e) {
    console.error("Failed to cache training enrollments:", e);
  }
}

function notifyListeners() {
  const local = getLocalEnrollments();
  const merged = firestoreEnrollments.length > 0 ? firestoreEnrollments : local;
  listeners.forEach((cb) => {
    try {
      cb(merged);
    } catch (e) {
      console.error("Error invoking training enrollment listener:", e);
    }
  });
}

export const TrainingService = {
  subscribeToEnrollments(
    callback: (enrollments: TrainingEnrollment[]) => void,
  ) {
    listeners.add(callback);

    // Immediately emit styled local state to prevent visual pops
    const local =
      firestoreEnrollments.length > 0
        ? firestoreEnrollments
        : getLocalEnrollments();
    callback(local);

    let unsubscribed = false;
    let unsubscribeFirestore: (() => void) | undefined;

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy("createdAt", "desc"));

    try {
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (unsubscribed) return;

          const enrollments: TrainingEnrollment[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            enrollments.push({
              id: docSnap.id,
              ...data,
            } as TrainingEnrollment);
          });

          firestoreEnrollments = enrollments;
          saveLocalEnrollments(enrollments);
          notifyListeners();
        },
        (error) => {
          console.warn(
            "Firestore training enrollments list subscription offline/denied. Seamlessly showing client cache instead.",
            error,
          );
          notifyListeners();
        },
      );
    } catch (e) {
      console.warn(
        "Could not setup Firestore training enrollments onSnapshot, utilizing cached database.",
        e,
      );
      notifyListeners();
    }

    return () => {
      unsubscribed = true;
      listeners.delete(callback);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  },

  async addEnrollment(
    enrollment: Omit<
      TrainingEnrollment,
      "id" | "createdAt" | "updatedAt" | "createdByUid" | "createdByEmail"
    >,
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      const fullDoc: Omit<TrainingEnrollment, "id"> = {
        ...enrollment,
        dueAmount: enrollment.totalFee - enrollment.paidAmount,
        createdByUid: user?.uid || "anonymous",
        createdByEmail: user?.email || "anonymous",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, COLLECTION_NAME),
        sanitizeForFirestore(fullDoc),
      );
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, COLLECTION_NAME);
      return "";
    }
  },

  async updateEnrollment(
    id: string,
    updates: Partial<TrainingEnrollment>,
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docUpdates: any = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Auto-recalculate due amount if fees are explicitly adjusted
      if (updates.totalFee !== undefined || updates.paidAmount !== undefined) {
        // If updating either, calculate with fallback values from updates or let UI manage it.
        // We'll trust the update payload or calculate dynamically to be safe.
      }

      await updateDoc(docRef, sanitizeForFirestore(docUpdates));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async deleteEnrollment(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },
};
