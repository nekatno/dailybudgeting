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
          .map((item) => ({ id: item.id, ...item.data() }) as AuditLog)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      )
  );
}

export async function listTransactions(userId: string) {
  const snapshot = await getDocs(query(collection(db, "transactions"), where("userId", "==", userId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as Transaction)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function addAuditLog(payload: Omit<AuditLog, "id" | "createdAt">) {
  await addDoc(collection(db, "auditLogs"), {
    ...payload,
    createdAt: nowISO()
  });
}

export async function createTransaction(payload: Omit<Transaction, "id" | "createdAt" | "updatedAt">) {
  const timestamp = nowISO();
  const ref = await addDoc(collection(db, "transactions"), {
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  const transaction = { id: ref.id, ...payload, createdAt: timestamp, updatedAt: timestamp };
  await addAuditLog({
    userId: payload.userId,
    action: "add_transaction",
    entityType: "transaction",
    entityId: ref.id,
    newValue: transaction
  });
  return transaction;
}

export async function updateTransaction(transaction: Transaction, next: Partial<Transaction>) {
  const updated = { ...transaction, ...next, updatedAt: nowISO() };
  await updateDoc(doc(db, "transactions", transaction.id), stripId(updated));
  await addAuditLog({
    userId: transaction.userId,
    action: "edit_transaction",
    entityType: "transaction",
    entityId: transaction.id,
    oldValue: transaction,
    newValue: updated
  });
  return updated;
}

export async function removeTransaction(transaction: Transaction) {
  await deleteDoc(doc(db, "transactions", transaction.id));
  await addAuditLog({
    userId: transaction.userId,
    action: "delete_transaction",
    entityType: "transaction",
    entityId: transaction.id,
    oldValue: transaction
  });
}

export async function saveBudget(payload: Omit<Budget, "id" | "createdAt" | "updatedAt">, id?: string) {
  const timestamp = nowISO();
  if (id) {
    await updateDoc(doc(db, "budgets", id), { ...payload, updatedAt: timestamp });
    return { id, ...payload, createdAt: timestamp, updatedAt: timestamp };
  }
  const ref = await addDoc(collection(db, "budgets"), { ...payload, createdAt: timestamp, updatedAt: timestamp });
  return { id: ref.id, ...payload, createdAt: timestamp, updatedAt: timestamp };
}

export async function saveRecurring(payload: Omit<RecurringExpense, "id" | "createdAt" | "updatedAt">, id?: string) {
  const timestamp = nowISO();
  if (id) {
    await updateDoc(doc(db, "recurringExpenses", id), { ...payload, updatedAt: timestamp });
    return { id, ...payload, createdAt: timestamp, updatedAt: timestamp };
  }
  const ref = await addDoc(collection(db, "recurringExpenses"), { ...payload, createdAt: timestamp, updatedAt: timestamp });
  return { id: ref.id, ...payload, createdAt: timestamp, updatedAt: timestamp };
}

export async function createClosing(payload: Omit<DailyClosing, "id" | "createdAt" | "confirmedAt">) {
  const timestamp = nowISO();
  const ref = await addDoc(collection(db, "dailyClosings"), {
    ...payload,
    confirmedAt: timestamp,
    createdAt: timestamp
  });
  const closing = { id: ref.id, ...payload, confirmedAt: timestamp, createdAt: timestamp };
  await addAuditLog({
    userId: payload.userId,
    action: "daily_closing",
    entityType: "closing",
    entityId: ref.id,
    newValue: closing
  });
  return closing;
}

export async function updateUserSettings(userId: string, payload: Partial<UserProfile>) {
  await updateDoc(doc(db, "users", userId), { ...payload, updatedAt: nowISO() });
}
