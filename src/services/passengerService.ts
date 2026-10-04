import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  arrayUnion,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../lib/firebase";
import { Passenger, DuplicateCheckResult } from "../types/passenger";

const COLLECTION_NAME = "passengers";

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
    // Only recursively sanitize plain objects. Leave specialized class instances (like serverTimestamp, arrayUnion, Date) intact.
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

const LOCAL_STORAGE_KEY = "cached_passengers";

const listeners = new Set<(passengers: Passenger[]) => void>();
let firestorePassengers: Passenger[] = [];

// Helper to load passengers from localStorage safely
function getLocalPassengers(): Passenger[] {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.error("Failed to parse cached_passengers from localStorage:", e);
    return [];
  }
}

// Helper to save passengers to localStorage safely
function saveLocalPassengers(passengers: Passenger[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(passengers));
  } catch (e) {
    // If it fails (likely due to quota), try to remove large base64 strings from the cache
    try {
      const stripped = passengers.map(p => {
        const pCopy = { ...p };
        if (pCopy.photoUrl && pCopy.photoUrl.startsWith('data:')) {
          pCopy.photoUrl = ''; 
        }
        if (pCopy.documents) {
          pCopy.documents = pCopy.documents.map(d => {
             if (d.url && d.url.startsWith('data:')) {
                return { ...d, url: '' };
             }
             return d;
          });
        }
        if (pCopy.requiredDocs) {
          const reqDocs = { ...pCopy.requiredDocs };
          Object.keys(reqDocs).forEach(key => {
             if (reqDocs[key].fileUrl && reqDocs[key].fileUrl!.startsWith('data:')) {
                reqDocs[key].fileUrl = '';
             }
          });
          pCopy.requiredDocs = reqDocs;
        }
        return pCopy;
      });
      // Try again with stripped base64, and keep only the last 500 items
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stripped.slice(0, 500)));
    } catch (e2) {
      console.warn("Could not cache passengers in localStorage even after stripping data.");
    }
  }
}

// Helper to background sync to Google Apps Script Web App
async function syncToGoogleScript(passengersList: any[]) {
  const url = localStorage.getItem("google_script_url");
  if (!url) return;
  try {
    const payload = {
      action: "sync_all",
      passengers: passengersList.map((p, idx) => ({
        sl: p.sl || idx + 1,
        name: p.name || "",
        passportNumber: p.passportNumber || "",
        inOut: p.inOut || "",
        phone: p.phone || "",
        tradeName: p.tradeName || "",
        agentName: p.agentName || "",
        reference: p.reference || "",
        status: p.status || "",
        date: p.date || "",
        submissionDate: p.submissionDate || "",
      })),
    };
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(
      "Google Apps Script background autosync failed (offline/network issue):",
      err,
    );
  }
}

// Helper to notify all registered React callbacks
function notifyListeners() {
  const local = getLocalPassengers();
  // Start with Firebase data
  const merged: Passenger[] = [...firestorePassengers];

  // Blend in local pending placeholder records that do not exist yet in Firestore
  const localOnlyAdditions = local.filter(
    (p) => p.id && p.id.startsWith("local_"),
  );
  localOnlyAdditions.forEach((p) => {
    if (
      !merged.some(
        (m) => m.passportNumber === p.passportNumber || m.id === p.id,
      )
    ) {
      merged.unshift(p);
    }
  });

  // Perform highly resilient in-memory sorting
  merged.sort((a, b) => {
    const getMillis = (item: any) => {
      if (!item) return 0;
      if (item.createdAt) {
        if (typeof item.createdAt.toDate === "function") {
          return item.createdAt.toDate().getTime();
        }
        if (item.createdAt.seconds) {
          return item.createdAt.seconds * 1000;
        }
        const parsed = Date.parse(item.createdAt);
        if (!isNaN(parsed)) return parsed;
      }
      if (item.updatedAt) {
        if (typeof item.updatedAt.toDate === "function") {
          return item.updatedAt.toDate().getTime();
        }
        if (item.updatedAt.seconds) {
          return item.updatedAt.seconds * 1000;
        }
        const parsed = Date.parse(item.updatedAt);
        if (!isNaN(parsed)) return parsed;
      }
      return (Number(item.sl) || 0) * 1000;
    };
    return getMillis(b) - getMillis(a);
  });

  listeners.forEach((cb) => {
    try {
      cb(merged);
    } catch (e) {
      console.error("Error invoking passenger listener:", e);
    }
  });
}

const TIMEOUT_MS = 15000;

async function executeWithTimeout<T>(
  promise: Promise<T>,
  fallbackAction: () => Promise<T> | T,
  operationLabel: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let hasFinished = false;
    const timer = setTimeout(async () => {
      if (!hasFinished) {
        hasFinished = true;
        console.warn(
          `Firestore operation '${operationLabel}' timed out after ${TIMEOUT_MS}ms. Falling back to local offline DB mode gracefully.`,
        );
        try {
          const res = await fallbackAction();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }
    }, TIMEOUT_MS);

    promise
      .then((res) => {
        if (!hasFinished) {
          hasFinished = true;
          clearTimeout(timer);
          resolve(res);
        }
      })
      .catch(async (err) => {
        if (!hasFinished) {
          hasFinished = true;
          clearTimeout(timer);
          console.warn(
            `Firestore operation '${operationLabel}' rejected. Falling back to local offline DB mode gracefully.`,
            err,
          );
          try {
            const res = await fallbackAction();
            resolve(res);
          } catch (fallbackErr) {
            reject(err);
          }
        }
      });
  });
}

async function compressImageFile(
  file: File,
  maxSize = 600,
  quality = 0.45,
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                  {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  },
                );
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality,
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export const PassengerService = {
  async testConnection() {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("the client is offline")
      ) {
        console.error("Please check your Firebase configuration.");
      }
    }
  },

  async checkDuplicatePassport(
    passportNumber: string,
    excludeId?: string,
  ): Promise<DuplicateCheckResult> {
    const cleanPassport = (passportNumber || "").trim().toUpperCase();
    if (!cleanPassport) return { isDuplicate: false };

    // 1. Check live Firestore in-memory cache first (most up-to-date and accurate)
    const duplicateCache = firestorePassengers.find((p) => {
      const pNum = (p.passportNumber || "").trim().toUpperCase();
      return pNum === cleanPassport && p.id !== excludeId;
    });

    if (duplicateCache) {
      return {
        isDuplicate: true,
        duplicateSl: duplicateCache.sl,
        duplicateName: duplicateCache.name,
        duplicatePassport: duplicateCache.passportNumber,
        duplicateStatus: duplicateCache.status,
        duplicateCountry: duplicateCache.country,
        duplicateDate: duplicateCache.date,
        duplicateAgent: duplicateCache.agentName || duplicateCache.reference,
        duplicateId: duplicateCache.id,
        duplicatePassenger: duplicateCache,
        duplicateBranch: duplicateCache.branch === "diabari" ? "দিয়াবাড়ী (হেড অফিস)" : "নেক্সট্রিপ",
        source: "firestore",
        isLocalOnly: false,
      };
    }

    // 2. Query Firestore directly to ensure no multi-device mismatch
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snap = await getDocs(q);
      const duplicateDb = snap.docs.find((doc) => {
        const data = doc.data();
        const pNum = (data.passportNumber || "").trim().toUpperCase();
        return pNum === cleanPassport && doc.id !== excludeId;
      });
      if (duplicateDb) {
        const pData = duplicateDb.data() as Passenger;
        const fullObj: Passenger = { id: duplicateDb.id, ...pData };
        return {
          isDuplicate: true,
          duplicateSl: pData.sl,
          duplicateName: pData.name,
          duplicatePassport: pData.passportNumber,
          duplicateStatus: pData.status,
          duplicateCountry: pData.country,
          duplicateDate: pData.date,
          duplicateAgent: pData.agentName || pData.reference,
          duplicateId: duplicateDb.id,
          duplicatePassenger: fullObj,
          duplicateBranch: pData.branch === "diabari" ? "দিয়াবাড়ী (হেড অফিস)" : "নেক্সট্রিপ",
          source: "firestore",
          isLocalOnly: false,
        };
      }
    } catch (e) {
      console.warn("Could not query DB for duplicates, relying on cache.", e);
    }

    // 3. Check local storage ONLY for un-synced offline drafts ('local_...')
    // Never flag deleted/stale records from localStorage as duplicates!
    const local = getLocalPassengers();
    const duplicateLocal = local.find((p) => {
      const pNum = (p.passportNumber || "").trim().toUpperCase();
      return (
        pNum === cleanPassport &&
        p.id !== excludeId &&
        Boolean(p.id && p.id.startsWith("local_"))
      );
    });

    if (duplicateLocal) {
      return {
        isDuplicate: true,
        duplicateSl: duplicateLocal.sl,
        duplicateName: duplicateLocal.name,
        duplicatePassport: duplicateLocal.passportNumber,
        duplicateStatus: duplicateLocal.status,
        duplicateCountry: duplicateLocal.country,
        duplicateDate: duplicateLocal.date,
        duplicateAgent: duplicateLocal.agentName || duplicateLocal.reference,
        duplicateId: duplicateLocal.id,
        duplicatePassenger: duplicateLocal,
        duplicateBranch: duplicateLocal.branch === "diabari" ? "দিয়াবাড়ী (হেড অফিস)" : "নেক্সট্রিপ",
        source: "local",
        isLocalOnly: true,
      };
    }

    return { isDuplicate: false };
  },

  checkDuplicateSl(
    sl: number,
    excludeId?: string,
  ): { isDuplicate: boolean; existingPassenger?: Passenger } {
    if (!sl || isNaN(sl)) return { isDuplicate: false };
    const targetSl = Number(sl);
    const found = firestorePassengers.find(
      (p) => Number(p.sl) === targetSl && p.id !== excludeId,
    );
    if (found) {
      return { isDuplicate: true, existingPassenger: found };
    }
    return { isDuplicate: false };
  },

  purgeLocalDraft(passportNumberOrId: string) {
    const clean = passportNumberOrId.trim().toUpperCase();
    const local = getLocalPassengers();
    const filtered = local.filter((p) => {
      const pNum = (p.passportNumber || "").trim().toUpperCase();
      return p.id !== passportNumberOrId && pNum !== clean;
    });
    saveLocalPassengers(filtered);
    notifyListeners();
  },

  clearLocalCache() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear cached_passengers:", e);
    }
    notifyListeners();
  },

  async addPassenger(
    passenger: Omit<Passenger, "id" | "createdAt" | "updatedAt">,
  ) {
    // Ensure SL counting is strictly sequential and collision-free per branch
    let assignedSl = passenger.sl;
    const targetBranch = passenger.branch || "nextrip";
    const existingSls = firestorePassengers
      .filter((p) =>
        targetBranch === "diabari"
          ? p.branch === "diabari"
          : !p.branch || p.branch === "nextrip",
      )
      .map((p) => Number(p.sl))
      .filter((s) => !isNaN(s) && s < 1000000);
    const maxSl = existingSls.length > 0 ? Math.max(...existingSls) : 0;

    if (!assignedSl || isNaN(Number(assignedSl)) || Number(assignedSl) <= 0) {
      assignedSl = maxSl + 1;
    } else if (existingSls.includes(Number(assignedSl))) {
      // If the provided SL is already occupied by another entry, assign next available SL
      console.warn(
        `SL #${assignedSl} is already in use by another passenger. Assigning next available SL #${maxSl + 1}`,
      );
      assignedSl = maxSl + 1;
    }

    const cleaned = sanitizeForFirestore({
      ...passenger,
      sl: Number(assignedSl),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: passenger.history || [],
    });

    const firestorePromise = async () => {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleaned);
      // If this passenger was in local offline storage, purge it now that it is written to Firestore
      if (passenger.passportNumber) {
        PassengerService.purgeLocalDraft(passenger.passportNumber);
      }
      return docRef;
    };

    const fallback = () => {
      const localId = "local_" + Date.now();
      const localPassenger: Passenger = {
        ...passenger,
        sl: Number(assignedSl),
        id: localId,
        createdAt: new Date().toISOString() as any,
        updatedAt: new Date().toISOString() as any,
        history: passenger.history || [],
      } as any;

      const cached = getLocalPassengers();
      cached.unshift(localPassenger);
      saveLocalPassengers(cached);
      notifyListeners();

      // Auto background backup sheet sync
      syncToGoogleScript(cached);
      return { id: localId } as any;
    };

    return executeWithTimeout(firestorePromise(), fallback, "addPassenger");
  },

  async updatePassenger(
    id: string,
    updates: Partial<Passenger>,
    historyEntry?: any,
  ) {
    const passengerRef = doc(db, COLLECTION_NAME, id);
    const data: any = sanitizeForFirestore({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    if (historyEntry) {
      data.history = arrayUnion(sanitizeForFirestore(historyEntry));
    }

    const firestorePromise = async () => {
      return await updateDoc(passengerRef, data);
    };

    const fallback = () => {
      const cached = getLocalPassengers();
      const idx = cached.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const current = cached[idx];
        const updatedHistory = historyEntry
          ? [
              ...(current.history || []),
              { ...historyEntry, timestamp: new Date().toISOString() },
            ]
          : current.history || [];

        cached[idx] = {
          ...current,
          ...updates,
          history: updatedHistory,
          updatedAt: new Date().toISOString() as any,
        };
        saveLocalPassengers(cached);
        notifyListeners();

        // Auto background backup sheet sync
        syncToGoogleScript(cached);
      }
      return null as any;
    };

    if (id && id.startsWith("local_")) {
      fallback();
      return null as any;
    }

    return executeWithTimeout(firestorePromise(), fallback, "updatePassenger");
  },

  async deletePassenger(id: string) {
    const passengerRef = doc(db, COLLECTION_NAME, id);

    const firestorePromise = async () => {
      return await deleteDoc(passengerRef);
    };

    const fallback = () => {
      const cached = getLocalPassengers();
      const filtered = cached.filter((p) => p.id !== id);
      saveLocalPassengers(filtered);
      notifyListeners();

      // Auto background backup sheet sync
      syncToGoogleScript(filtered);
      return null as any;
    };

    if (id && id.startsWith("local_")) {
      fallback();
      return null as any;
    }

    return executeWithTimeout(firestorePromise(), fallback, "deletePassenger");
  },

  subscribeToPassengers(callback: (passengers: Passenger[]) => void) {
    listeners.add(callback);

    // Immediately invoke callback with local storage cache to keep interface fully interactive
    const local = getLocalPassengers();
    if (local.length > 0) {
      callback(local);
    }

    let unsubscribed = false;
    let unsubscribeFirestore: (() => void) | undefined;

    const q = query(collection(db, COLLECTION_NAME));
    try {
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (unsubscribed) return;

          firestorePassengers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Passenger[];

          const currentLocal = getLocalPassengers();
          const firestorePassportSet = new Set(
            firestorePassengers
              .map((p) => (p.passportNumber || "").trim().toUpperCase())
              .filter(Boolean),
          );

          // Only keep local pending additions that do NOT exist in Firestore
          const pendingOnes = currentLocal.filter((p) => {
            if (!p.id || !p.id.startsWith("local_")) return false;
            const pNum = (p.passportNumber || "").trim().toUpperCase();
            return pNum ? !firestorePassportSet.has(pNum) : false;
          });

          const fullCached = [...firestorePassengers, ...pendingOnes];
          saveLocalPassengers(fullCached);
          notifyListeners();
        },
        (error) => {
          console.warn(
            "Firestore list subscription offline/denied. Seamlessly showing client cache database instead.",
            error,
          );
          notifyListeners();
        },
      );
    } catch (e) {
      console.warn(
        "Could not setup Firestore onSnapshot, utilizing cached database rules.",
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

  async bulkAddPassengers(passengers: any[]) {
    const firestorePromise = async () => {
      const { writeBatch, doc, collection, serverTimestamp } =
        await import("firebase/firestore");
      const batch = writeBatch(db);
      const colRef = collection(db, COLLECTION_NAME);

      passengers.forEach((p) => {
        const docRef = doc(colRef);
        const cleaned = sanitizeForFirestore({
          ...p,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          history: p.history || [],
        });
        batch.set(docRef, cleaned);
      });
      return await batch.commit();
    };

    const fallback = () => {
      const cached = getLocalPassengers();
      const mapped = passengers.map((p, idx) => ({
        ...p,
        id: p.id || "local_" + (Date.now() + idx),
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      }));

      const merged = [...mapped, ...cached];
      saveLocalPassengers(merged);
      notifyListeners();

      // Auto background backup sheet sync
      syncToGoogleScript(merged);
      return null as any;
    };

    return executeWithTimeout(
      firestorePromise(),
      fallback,
      "bulkAddPassengers",
    );
  },

  async uploadDocument(
    file: File,
    passengerId: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    // 1. Compress image client-side to keep file size extremely small (typically <30KB)
    let fileToUpload = file;
    if (file.type.startsWith("image/")) {
      try {
        fileToUpload = await compressImageFile(file, 600, 0.45);
      } catch (err) {
        console.warn(
          "Image client-side compression failed, using original file instead:",
          err,
        );
      }
    }

    const { uploadBytesResumable, getDownloadURL } =
      await import("firebase/storage");
    const storageRef = ref(
      storage,
      `documents/${passengerId}/${Date.now()}_${fileToUpload.name}`,
    );

    const getBase64Fallback = async (f: File): Promise<string> => {
      return new Promise((resolveBase64, rejectBase64) => {
        if (!f.type.startsWith("image/") && f.size > 350 * 1024) {
          rejectBase64(
            new Error(
              `PDF file is too large (${Math.round(f.size / 1024)}KB) for fallback storage. Maximum limit is 300KB when Firebase Storage is offline. Please use Google Drive (Drive) integration or reduce PDF size.`,
            ),
          );
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          resolveBase64(e.target?.result as string);
        };
        reader.onerror = (err) => rejectBase64(err);
        reader.readAsDataURL(f);
      });
    };

    return new Promise((resolve, reject) => {
      let uploadTask: any;
      let hasFinished = false;

      const performFallback = async (err?: any) => {
        if (hasFinished) return;
        hasFinished = true;
        try {
          if (uploadTask && typeof uploadTask.cancel === "function") {
            uploadTask.cancel();
          }
        } catch (e) {}

        console.warn(
          "Firebase Storage fallback triggered (likely permissions/rules/not enabled or timeout):",
          err,
        );
        if (onProgress) onProgress(50);
        try {
          const base64Url = await getBase64Fallback(fileToUpload);
          if (onProgress) onProgress(100);
          resolve(base64Url);
        } catch (errFallback) {
          reject(errFallback instanceof Error ? errFallback : err);
        }
      };

      const watchdogTimer = setTimeout(() => {
        if (!hasFinished) {
          performFallback(new Error("Storage upload timed out"));
        }
      }, 7500);

      try {
        uploadTask = uploadBytesResumable(storageRef, fileToUpload);
      } catch (e) {
        clearTimeout(watchdogTimer);
        console.warn(
          "Storage upload task initialization failed...",
          e,
        );
        performFallback(e);
        return;
      }

      uploadTask.on(
        "state_changed",
        (snapshot: any) => {
          if (snapshot.bytesTransferred > 0) {
            clearTimeout(watchdogTimer);
          }
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 1500 === 0
              ? 0
              : (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error: any) => {
          clearTimeout(watchdogTimer);
          performFallback(error);
        },
        () => {
          clearTimeout(watchdogTimer);
          if (hasFinished) return;
          hasFinished = true;
          if (onProgress) onProgress(100);
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL: string) => {
              resolve(downloadURL);
            })
            .catch(async (errUrl: any) => {
              console.warn(
                "Failed to get download URL, falling back to Base64:",
                errUrl,
              );
              try {
                const base64Url = await getBase64Fallback(fileToUpload);
                resolve(base64Url);
              } catch (errFallback) {
                reject(errFallback instanceof Error ? errFallback : errUrl);
              }
            });
        },
      );
    });
  },

  async uploadToDrive(
    file: File,
    _passengerId: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    const token = sessionStorage.getItem("google_access_token");
    if (!token)
      throw new Error(
        "Access denied. Please re-authorize by signing in with Google again.",
      );

    let fileToUpload = file;
    if (file.type.startsWith("image/")) {
      try {
        fileToUpload = await compressImageFile(file, 800, 0.55); // Slightly higher resolution for GDrive but still highly optimized
      } catch (err) {
        console.warn(
          "Drive upload image compression failed, utilizing raw file:",
          err,
        );
      }
    }

    const metadata = {
      name: fileToUpload.name,
      mimeType: fileToUpload.type,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    form.append("file", fileToUpload);

    if (onProgress) onProgress(10); // Simple start indicator

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `Drive upload failed: ${response.statusText}`,
      );
    }

    const result = await response.json();
    if (onProgress) onProgress(100);
    return result.webViewLink;
  },
};
