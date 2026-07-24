import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any = null;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (e) {
  console.warn('Firebase app initialization warning:', e);
}

let dbInstance: any = null;
try {
  if (app) {
    const dbId = (firebaseConfig as any)?.firestoreDatabaseId;
    dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch (e) {
  console.warn('Firestore initialization warning:', e);
}

let authInstance: any = null;
try {
  if (app) {
    authInstance = getAuth(app);
  }
} catch (e) {
  console.warn('Firebase Auth initialization warning:', e);
}

export const db = dbInstance;
export const auth = authInstance;

