import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore
let dbInstance: any;
try {
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
    console.log(`Initializing Firestore with named database ID: ${firebaseConfig.firestoreDatabaseId}`);
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    dbInstance = getFirestore(app);
  }
} catch (e) {
  console.error("Failed to initialize Firestore with named database, falling back to (default):", e);
  dbInstance = getFirestore(app);
}

// Connection test and potential fallback
async function testAndSwitch() {
  try {
    const dbId = (dbInstance as any)._databaseId?.database || '(default)';
    await getDocFromServer(doc(dbInstance, 'test_connection', 'status'));
    console.log(`Firestore client connection successful for database: ${dbId}`);
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const dbId = (dbInstance as any)._databaseId?.database || '(default)';
    console.error(`Firestore client connection failed for database ${dbId}:`, errorMessage);
    
    if ((errorMessage.includes('permission-denied') || errorMessage.includes('not-found')) && dbId !== '(default)') {
      console.warn("Named database not found or permission denied. Switching to (default) database...");
      try {
        const fallbackDb = getFirestore(app);
        await getDocFromServer(doc(fallbackDb, 'test_connection', 'status'));
        console.log("Fallback to (default) database successful. Updating global db instance.");
        dbInstance = fallbackDb;
      } catch (fallbackError) {
        console.error("Fallback to (default) database also failed:", fallbackError);
      }
    }
  }
}
testAndSwitch();

export let db = dbInstance;

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export { onAuthStateChanged };
export type { User };
