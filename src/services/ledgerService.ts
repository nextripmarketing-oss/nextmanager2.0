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
import { CashTransaction } from "../types/ledger";

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
    isAnonymous?: boolean | null;
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
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const LedgerService = {
  subscribeToTransactions(onUpdate: (transactions: CashTransaction[]) => void) {
    const colRef = collection(db, "office_ledger");
    const q = query(colRef);

    return onSnapshot(
      q,
      (snapshot) => {
        const txs: CashTransaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          txs.push({
            id: docSnap.id,
            date: data.date || "",
            type: data.type || "Inflow",
            amount: Number(data.amount) || 0,
            purpose: data.purpose || "",
            remarks: data.remarks || "",
            createdByUid: data.createdByUid || "",
            createdByEmail: data.createdByEmail || "",
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
              : undefined,
            isMedicalVoucher: data.isMedicalVoucher || false,
            medicalReferenceId: data.medicalReferenceId || "",
            medicalReferenceName: data.medicalReferenceName || "",
            medicalCommission:
              data.medicalCommission !== undefined
                ? Number(data.medicalCommission)
                : 0,
            passengerId: data.passengerId || "",
            passengerName: data.passengerName || "",
          });
        });

        // Sort in-memory desc by date, fallback to createdAt
        txs.sort((a, b) => {
          const comp = b.date.localeCompare(a.date);
          if (comp !== 0) return comp;
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        onUpdate(txs);
      },
      (error) => {
        console.warn(
          "Firestore ledger list subscription error, handling gracefully:",
          error,
        );
        onUpdate([]);
      },
    );
  },

  async addTransaction(tx: Omit<CashTransaction, "id" | "createdAt">) {
    const path = "office_ledger";
    try {
      const colRef = collection(db, path);
      const docRef = await addDoc(colRef, {
        ...tx,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateTransaction(id: string, updates: Partial<CashTransaction>) {
    const path = `office_ledger/${id}`;
    try {
      const docRef = doc(db, "office_ledger", id);
      await updateDoc(docRef, {
        ...updates,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteTransaction(id: string) {
    const path = `office_ledger/${id}`;
    try {
      const docRef = doc(db, "office_ledger", id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
};
