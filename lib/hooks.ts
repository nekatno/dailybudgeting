"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  subscribeAuditLogs,
  subscribeBudgets,
  subscribeClosings,
  subscribeRecurring,
  subscribeTransactions
} from "@/lib/repositories";
import type { AuditLog, Budget, DailyClosing, RecurringExpense, Transaction } from "@/lib/types";
import { transactionsForToday } from "@/lib/utils";

export function useUserData() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return undefined;
    setLoading(true);
    const unsubscribers = [
      subscribeTransactions(profile.id, setTransactions),
      subscribeBudgets(profile.id, setBudgets),
      subscribeRecurring(profile.id, setRecurring),
      subscribeClosings(profile.id, setClosings),
      subscribeAuditLogs(profile.id, setAuditLogs)
    ];
    setLoading(false);
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [profile]);

  const summary = useMemo(() => {
    const today = transactionsForToday(transactions);
    const income = today.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = today.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const dailyBudget = budgets.find((budget) => budget.type === "daily")?.amount ?? 0;
    return {
      today,
      income,
      expense,
      dailyBudget,
      remaining: dailyBudget - expense
    };
  }, [transactions, budgets]);

  return { profile, transactions, budgets, recurring, closings, auditLogs, summary, loading };
}
