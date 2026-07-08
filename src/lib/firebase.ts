import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errMsg = error instanceof Error ? error.message : String(error);
  
  // Cleanly handle missing permissions gracefully without dumping JSON to console
  // This allows the app to fallback to local-only mode or gracefully skip
  if (errMsg.includes("Missing or insufficient permissions")) {
    console.warn(`[Firebase Emulator/Preview Mode] Skipped ${operationType} on ${path}: Missing permissions.`);
    // Still throw, but throw a clean error
    throw new Error(`Permission Denied: Ensure database rules are deployed or environment is properly authenticated for path: ${path}`);
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  
  throw new Error(`Firestore Error [${operationType}] on ${path}: ${errMsg}`);
}

export async function verifyFirebaseConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Attempt a cold-start read of a test connection document with a 3-second timeout
    await Promise.race([
      getDocFromServer(doc(db, "test_connection", "ping")),
      new Promise((_, reject) => setTimeout(() => reject(new Error("unavailable: timeout")), 3000))
    ]);
    return { success: true };
  } catch (err: any) {
    const isNetworkError =
      err.message?.includes("network") ||
      err.message?.includes("offline") ||
      err.message?.includes("failed-precondition") ||
      err.message?.includes("unavailable");

    if (isNetworkError) {
      return {
        success: false,
        error: `Firebase database connectivity check failed: ${err.message}. Please check if your database is enabled under ${firebaseConfig.projectId}, and verify your network status details.`,
      };
    }
    // permission-denied or document-not-found means we did reach the firestore server
    return { success: true };
  }
}
