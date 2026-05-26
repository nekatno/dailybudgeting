"use client";

import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
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

export function buildGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  provider.addScope("https://www.googleapis.com/auth/spreadsheets");
  provider.setCustomParameters({ prompt: "select_account consent" });
  return provider;
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, buildGoogleProvider());
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
