"use client";

import { BellRing } from "lucide-react";
import { Card } from "@/components/ui";
import type { BudgetStatus, RecurringExpense } from "@/lib/types";

export function NotificationPanel({
  hasTransactionToday,
  budgetStatus,
  recurring
}: {
  hasTransactionToday: boolean;
  budgetStatus: BudgetStatus;
  recurring: RecurringExpense[];
}) {
  const messages = [
    !hasTransactionToday ? "Belum input transaksi hari ini" : null,
    budgetStatus === "Waspada" ? "Budget hampir habis" : null,
    budgetStatus === "Overbudget" ? "Overbudget" : null,
    recurring.some((item) => item.isActive) ? "Recurring expense jatuh tempo perlu dicek" : null
  ].filter(Boolean);

  return (
    <Card>
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-amber-500" />
        <h2 className="font-semibold">Reminder & Notification</h2>
      </div>
      <div className="mt-3 space-y-2">
        {messages.length ? (
          messages.map((message) => (
            <div key={message} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-100">
              {message}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Tidak ada notifikasi aktif.</p>
        )}
      </div>
    </Card>
  );
}
