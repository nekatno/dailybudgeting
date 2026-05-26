"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadReceipt(userId: string, file?: File | null) {
  if (!file) return undefined;
  const path = `receipts/${userId}/${crypto.randomUUID()}-${file.name}`;
  const snapshot = await uploadBytes(ref(storage, path), file);
  return getDownloadURL(snapshot.ref);
}
