import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  collection,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { UserProfile, UserRole } from "../types/user";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error info: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const UserService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", uid);
      const getPromise = getDoc(userRef).then((snap) =>
        snap.exists() ? (snap.data() as UserProfile) : null,
      );

      return await Promise.race([
        getPromise,
        new Promise<UserProfile | null>((resolve) =>
          setTimeout(() => {
            console.warn(
              "Firestore getUserProfile timed out, fallback to null/local sync",
            );
            resolve(null);
          }, 2200),
        ),
      ]);
    } catch (error: any) {
      console.warn("Firestore fetch error (likely offline):", error.message);
      if (error && error.code === "permission-denied") {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      }
      return null;
    }
  },

  async ensureUserProfile(
    uid: string,
    email: string,
    displayName: string,
  ): Promise<UserProfile> {
    const normEmail = email.trim().toLowerCase();
    let expectedRole: UserRole = "Staff";
    if (
      normEmail === "nextripmarketing@gmail.com" ||
      normEmail === "nextriptourstravels@gmail.com" ||
      normEmail === "anisurkp1966@gmail.com" ||
      normEmail === "admin@123.com"
    ) {
      expectedRole = "Admin";
    } else if (normEmail === "m@123.com") {
      expectedRole = "Marketing Manager";
    } else if (normEmail === "account@123.com") {
      expectedRole = "Accountant";
    }

    let defaultTabs: string[] = ["dashboard", "passengers", "documents"];
    if (expectedRole === "Admin") {
      defaultTabs = [
        "dashboard",
        "passengers",
        "employment",
        "ledger",
        "agency",
        "documents",
        "settings",
      ];
    } else if (expectedRole === "Marketing Manager") {
      defaultTabs = [
        "dashboard",
        "passengers",
        "employment",
        "agency",
        "documents",
      ];
    } else if (expectedRole === "Accountant") {
      defaultTabs = ["dashboard", "ledger"];
    } else if (normEmail === "anextrip23@gmail.com") {
      defaultTabs = ["dashboard", "passengers", "employment", "ledger"];
    }

    try {
      const existing = await this.getUserProfile(uid);

      if (existing) {
        const isSystemAccount = [
          "nextripmarketing@gmail.com",
          "nextriptourstravels@gmail.com",
          "anisurkp1966@gmail.com",
          "admin@123.com",
          "m@123.com",
          "account@123.com",
          "anextrip23@gmail.com",
        ].includes(normEmail);

        const hasCorrectTabsForAnextrip =
          normEmail === "anextrip23@gmail.com" &&
          existing.allowedTabs &&
          existing.allowedTabs.includes("ledger") &&
          existing.allowedTabs.includes("employment") &&
          existing.allowedTabs.includes("passengers");

        const needsUpdate =
          (isSystemAccount && existing.role !== expectedRole) ||
          !existing.allowedTabs ||
          (normEmail === "anextrip23@gmail.com" && !hasCorrectTabsForAnextrip);

        if (needsUpdate) {
          const updated = {
            ...existing,
            role: isSystemAccount && existing.role !== expectedRole ? expectedRole : existing.role,
            allowedTabs: normEmail === "anextrip23@gmail.com" ? defaultTabs : (existing.allowedTabs || defaultTabs),
          };
          try {
            await setDoc(doc(db, "users", uid), updated, { merge: true });
          } catch (e: any) {
            console.warn("Could not update user profile/role in remote db:", e);
            if (e && e.code === "permission-denied") {
              handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
            }
          }
          return updated;
        }
        return existing;
      }

      const newUser: UserProfile = {
        uid,
        email,
        displayName:
          displayName && displayName !== "Anonymous"
            ? displayName
            : email.split("@")[0],
        role: expectedRole,
        createdAt: new Date().toISOString(),
        allowedTabs: defaultTabs,
      };

      try {
        await setDoc(doc(db, "users", uid), {
          ...newUser,
          createdAt: serverTimestamp(),
        });
      } catch (e: any) {
        console.warn("Could not save new user in remote db:", e);
        if (e && e.code === "permission-denied") {
          handleFirestoreError(e, OperationType.CREATE, `users/${uid}`);
        }
      }

      return newUser;
    } catch (error: any) {
      console.error("Error in ensureUserProfile:", error);
      // Fallback: return a provisional local profile if Firestore is totally unreachable
      return {
        uid,
        email,
        displayName,
        role: expectedRole,
        createdAt: new Date().toISOString(),
        allowedTabs: defaultTabs,
      };
    }
  },

  async getAllUserProfiles(): Promise<UserProfile[]> {
    const path = "users";
    try {
      const q = query(collection(db, path));
      const snap = await getDocs(q);
      const profiles: UserProfile[] = [];
      snap.forEach((docSnap) => {
        profiles.push(docSnap.data() as UserProfile);
      });
      return profiles;
    } catch (e: any) {
      console.error("Error in getAllUserProfiles:", e);
      if (e && e.code === "permission-denied") {
        handleFirestoreError(e, OperationType.LIST, path);
      }
      return [];
    }
  },

  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>,
  ): Promise<void> {
    const path = `users/${uid}`;
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, updates, { merge: true });
    } catch (e: any) {
      console.error("Error in updateUserProfile:", e);
      if (e && e.code === "permission-denied") {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
      throw e;
    }
  },
};
