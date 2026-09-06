import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Client SDK
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use provisioned Firestore Database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validate connection to Firestore as required by skill guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testFirestoreConnection();

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Get current user ID token for backend Authorization header
 */
export async function getCurrentUserIdToken(forceRefresh = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken(forceRefresh);
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

/**
 * Register with email and password
 */
export async function registerWithEmail(email: string, pass: string) {
  return await createUserWithEmailAndPassword(auth, email, pass);
}

/**
 * Sign in with Google Popup (Primary pre-configured provider)
 */
export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

/**
 * Demo / Anonymous login fallback helper
 */
export async function loginAsDemoUser() {
  try {
    return await signInAnonymously(auth);
  } catch (err: any) {
    if (err?.code === 'auth/admin-restricted-operation' || err?.code === 'auth/operation-not-allowed') {
      throw new Error(
        'Anonymous authentication is not enabled in this Firebase project. Please use "Sign In with Google".'
      );
    }
    throw err;
  }
}

/**
 * Sign out
 */
export async function logoutUser() {
  return await signOut(auth);
}

/**
 * Firestore strictly isolated paths:
 * Collection: users/{uid}/journalEntries
 */
export function getUserJournalCollection(uid: string) {
  if (!uid) throw new Error('Security Violation: UID must be provided for isolated collection query');
  return collection(db, 'users', uid, 'journalEntries');
}

/**
 * Document: users/{uid}/journalEntries/{entryId}
 */
export function getUserJournalDoc(uid: string, entryId: string) {
  if (!uid || !entryId) throw new Error('Security Violation: UID and entryId required');
  return doc(db, 'users', uid, 'journalEntries', entryId);
}

/**
 * Collection: users/{uid}/summaries
 */
export function getUserSummariesCollection(uid: string) {
  if (!uid) throw new Error('Security Violation: UID required');
  return collection(db, 'users', uid, 'summaries');
}

/**
 * Collection: users/{uid}/conversations
 */
export function getUserConversationsCollection(uid: string) {
  if (!uid) throw new Error('Security Violation: UID required');
  return collection(db, 'users', uid, 'conversations');
}

/**
 * Collection: users/{uid}/insights
 */
export function getUserInsightsCollection(uid: string) {
  if (!uid) throw new Error('Security Violation: UID required');
  return collection(db, 'users', uid, 'insights');
}
