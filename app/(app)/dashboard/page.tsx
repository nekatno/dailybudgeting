"use client";

import { format } from "date-fns";
import { PlusCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { NotificationPanel } from "@/components/notification-panel";
import { useUserData } from "@/lib/hooks";
import { calculateBudgetStatus, formatCurrency, formatDate, formatDateTime, statusClass } from "@/lib/utils";

export default function DashboardPage() {
  const { profile, transactions, recurring, summary } = useUserData();
  const status = calculateBudgetStatus(summary.expense, summary.dailyBudget);
  const progress = summary.dailyBudget ? (summary.expense / summary.dailyBudget) * 100 : 0;
  const chartData = transactions
    .filter((item) => item.type === "expense")
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.date] = (acc[item.date] ?? 0) + item.amount;
      return acc;
    }, {});
  const data = Object.entries(chartData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, amount]) => ({ date: format(new Date(date), "dd/MM"), amount }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        action={
          <Link className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" href="/transactions/new">
            <PlusCircle className="h-4 w-4" />
            Tambah Transaksi
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total budget hari ini</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.dailyBudget, profile?.currency)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total pengeluaran hari ini</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.expense, profile?.currency)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Sisa budget</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.remaining, profile?.currency)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Status budget</p>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(status)}`}>{status}</span>
          </div>
          <div className="mt-5">
            <ProgressBar value={progress} />
            <p className="mt-2 text-xs text-slate-500">{Math.round(progress)}% terpakai</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="min-h-80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Grafik pengeluaran harian</h2>
            <span className="text-xs text-slate-500">14 hari terakhir</span>
          </div>
          {data.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), profile?.currency)} />
                  <Area type="monotone" dataKey="amount" stroke="#14b879" fill="#d6faeb" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Belum ada grafik" description="Tambah transaksi pengeluaran untuk melihat tren harian." />
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Status sync Google Sheets</h2>
              <RefreshCw className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-3 text-sm text-slate-500">{profile?.spreadsheetId ? "Terhubung" : "Belum terhubung"}</p>
            <p className="mt-1 text-xs text-slate-500">Sync terakhir: {formatDateTime(profile?.lastSyncAt)}</p>
          </Card>
          <Card>
            <h2 className="font-semibold">Transaksi terakhir</h2>
            <div className="mt-3 space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{transaction.description || transaction.category}</p>
                    <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                  </div>
                  <p className={transaction.type === "expense" ? "text-sm font-semibold text-rose-600" : "text-sm font-semibold text-brand-600"}>
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(transaction.amount, profile?.currency)}
                  </p>
                </div>
              ))}
              {!transactions.length ? <EmptyState title="Kosong" description="Transaksi terakhir akan muncul di sini." /> : null}
            </div>
          </Card>
          <NotificationPanel hasTransactionToday={summary.today.length > 0} budgetStatus={status} recurring={recurring} />
        </div>
      </div>
    </div>
  );
}
