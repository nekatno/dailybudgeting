"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AuditLog, Budget, DailyClosing, RecurringExpense, Transaction, UserProfile } from "@/lib/types";
import { nowISO } from "@/lib/utils";

function stripId<T extends { id: string }>(item: T) {
  const { id, ...payload } = item;
  return payload;
}

function removeUndefined<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export async function upsertUser(profile: UserProfile) {
  const ref = doc(db, "users", profile.id);
  await setDoc(
    ref,
    {
      ...stripId(profile),
      updatedAt: nowISO(),
      createdAt: profile.createdAt ?? nowISO()
    },
    { merge: true }
  );
}

export function subscribeUser(userId: string, callback: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, "users", userId), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile) : null);
  });
}

export function subscribeTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
  return onSnapshot(
    query(collection(db, "transactions"), where("userId", "==", userId)),
    (snapshot) =>
      callback(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as Transaction)
          .sort((a, b) => b.date.localeCompare(a.date))
      )
  );
}

export function subscribeBudgets(userId: string, callback: (budgets: Budget[]) => void) {
  return onSnapshot(
    query(collection(db, "budgets"), where("userId", "==", userId)),
    (snapshot) =>
      callback(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as Budget)
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
      )
  );
}

export function subscribeRecurring(userId: string, callback: (items: RecurringExpense[]) => void) {
  return onSnapshot(
    query(collection(db, "recurringExpenses"), where("userId", "==", userId)),
    (snapshot) =>
      callback(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as RecurringExpense)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      )
  );
}

export function subscribeClosings(userId: string, callback: (items: DailyClosing[]) => void) {
  return onSnapshot(
    query(collection(db, "dailyClosings"), where("userId", "==", userId)),
    (snapshot) =>
      callback(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as DailyClosing)
          .sort((a, b) => b.date.localeCompare(a.date))
      )
  );
}

export function subscribeAuditLogs(userId: string, callback: (logs: AuditLog[]) => void) {
  return onSnapshot(
    query(collection(db, "auditLogs"), where("userId", "==", userId)),
    (snapshot) =>
      callback(
        snapshot.docs
