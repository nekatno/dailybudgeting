import { clsx, type ClassValue } from "clsx";
import { format, isSameDay, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import type { BudgetStatus, Transaction } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nowISO() {
  return new Date().toISOString();
}

export function todayISODate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDate(value: string) {
  return format(parseISO(value), "dd MMM yyyy", { locale: id });
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  return format(parseISO(value), "dd MMM yyyy HH:mm", { locale: id });
}

export function formatCurrency(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function transactionsForToday(transactions: Transaction[]) {
  const today = new Date();
  return transactions.filter((transaction) => isSameDay(parseISO(transaction.date), today));
}

export function calculateBudgetStatus(expense: number, budget: number): BudgetStatus {
  if (budget <= 0) return expense > 0 ? "Overbudget" : "Aman";
  const ratio = expense / budget;
  if (ratio >= 1) return "Overbudget";
  if (ratio >= 0.8) return "Waspada";
  return "Aman";
}

export function statusClass(status: BudgetStatus) {
  if (status === "Overbudget") return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200";
  if (status === "Waspada") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200";
}
