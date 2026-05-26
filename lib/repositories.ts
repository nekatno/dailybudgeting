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

function cleanFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanFirestoreData(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, cleanFirestoreData(item)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function sortByDateDesc<T extends { date: string }>(items: T[]) {
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

function sortByCreatedDesc<T extends { createdAt: string }>(items: T[]) {
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function upsertUser(profile: UserProfile) {
  const timestamp = nowISO();
  await setDoc(
    doc(db, "users", profile.id),
    cleanFirestoreData({
      ...stripId(profile),
      createdAt: profile.createdAt ?? timestamp,
      updatedAt: timestamp
    }),
    { merge: true }
  );
}

export function subscribeUser(userId: string, callback: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, "users", userId), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile) : null);
  });
}

export function subscribeTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
  return onSnapshot(query(collection(db, "transactions"), where("userId", "==", userId)), (snapshot) => {
    const transactions = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Transaction);
    callback(sortByDateDesc(transactions));
  });
}

export function subscribeBudgets(userId: string, callback: (budgets: Budget[]) => void) {
  return onSnapshot(query(collection(db, "budgets"), where("userId", "==", userId)), (snapshot) => {
    const budgets = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Budget);
    callback(budgets.sort((a, b) => b.startDate.localeCompare(a.startDate)));
  });
}

export function subscribeRecurring(userId: string, callback: (items: RecurringExpense[]) => void) {
  return onSnapshot(query(collection(db, "recurringExpenses"), where("userId", "==", userId)), (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as RecurringExpense);
    callback(sortByCreatedDesc(items));
  });
}

export function subscribeClosings(userId: string, callback: (items: DailyClosing[]) => void) {
  return onSnapshot(query(collection(db, "dailyClosings"), where("userId", "==", userId)), (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as DailyClosing);
    callback(sortByDateDesc(items));
  });
}

export function subscribeAuditLogs(userId: string, callback: (logs: AuditLog[]) => void) {
  return onSnapshot(query(collection(db, "auditLogs"), where("userId", "==", userId)), (snapshot) => {
    const logs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AuditLog);
    callback(sortByCreatedDesc(logs));
  });
}

export async function listTransactions(userId: string) {
  const snapshot = await getDocs(query(collection(db, "transactions"), where("userId", "==", userId)));
  const transactions = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Transaction);
  return sortByDateDesc(transactions);
}

export async function addAuditLog(payload: Omit<AuditLog, "id" | "createdAt">) {
  await addDoc(
    collection(db, "auditLogs"),
    cleanFirestoreData({
      ...payload,
      createdAt: nowISO()
    })
  );
}

export async function createTransaction(payload: Omit<Transaction, "id" | "createdAt" | "updatedAt">) {
  const timestamp = nowISO();
  const transactionPayload = cleanFirestoreData({
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  const ref = await addDoc(collection(db, "transactions"), transactionPayload);
  const transaction = { id: ref.id, ...transactionPayload } as Transaction;

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
  const updated = cleanFirestoreData({ ...transaction, ...next, updatedAt: nowISO() }) as Transaction;

  await updateDoc(doc(db, "transactions", transaction.id), cleanFirestoreData(stripId(updated)));
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
  const budgetPayload = cleanFirestoreData({
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  if (id) {
    await updateDoc(doc(db, "budgets", id), cleanFirestoreData({ ...payload, updatedAt: timestamp }));
    return { id, ...budgetPayload } as Budget;
  }

  const ref = await addDoc(collection(db, "budgets"), budgetPayload);
  return { id: ref.id, ...budgetPayload } as Budget;
}

export async function saveRecurring(payload: Omit<RecurringExpense, "id" | "createdAt" | "updatedAt">, id?: string) {
  const timestamp = nowISO();
  const recurringPayload = cleanFirestoreData({
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  if (id) {
    await updateDoc(doc(db, "recurringExpenses", id), cleanFirestoreData({ ...payload, updatedAt: timestamp }));
    return { id, ...recurringPayload } as RecurringExpense;
  }

  const ref = await addDoc(collection(db, "recurringExpenses"), recurringPayload);
  return { id: ref.id, ...recurringPayload } as RecurringExpense;
}

export async function createClosing(payload: Omit<DailyClosing, "id" | "createdAt" | "confirmedAt">) {
  const timestamp = nowISO();
  const closingPayload = cleanFirestoreData({
    ...payload,
    confirmedAt: timestamp,
    createdAt: timestamp
  });

  const ref = await addDoc(collection(db, "dailyClosings"), closingPayload);
  const closing = { id: ref.id, ...closingPayload } as DailyClosing;

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
  await updateDoc(
    doc(db, "users", userId),
    cleanFirestoreData({
      ...payload,
      updatedAt: nowISO()
    })
  );
}
