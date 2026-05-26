"use client";

import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let persistencePromise: Promise<void> | null = null;

function ensureAuthPersistence() {
  persistencePromise ??= setPersistence(auth, browserLocalPersistence);
  return persistencePromise;
}

export function buildGoogleProvider(options?: { includeSheets?: boolean; forceConsent?: boolean }) {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  if (options?.includeSheets) {
    provider.addScope("https://www.googleapis.com/auth/spreadsheets");
  }
  if (options?.forceConsent) {
    provider.setCustomParameters({ prompt: "consent" });
  }
  return provider;
}

export async function signInWithGoogle(options?: { includeSheets?: boolean; forceConsent?: boolean }) {
  await ensureAuthPersistence();
  const credential = await signInWithPopup(auth, buildGoogleProvider(options));
  const oauth = GoogleAuthProvider.credentialFromResult(credential);
  return {
    user: credential.user,
    accessToken: oauth?.accessToken
  };
}

export function logout() {
  return signOut(auth);
}

export function userToProfile(user: User) {
  return {
    id: user.uid,
    name: user.displayName ?? "User",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    currency: "IDR",
    autoSync: true
  };
}
