"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Card, PageHeader, ProgressBar, Button, EmptyState } from "@/components/ui";
import { categories } from "@/lib/constants";
import { useUserData } from "@/lib/hooks";
import { saveBudget } from "@/lib/repositories";
import type { BudgetType } from "@/lib/types";
import { calculateBudgetStatus, formatCurrency, statusClass, todayISODate } from "@/lib/utils";

export default function BudgetPage() {
  const { profile } = useAuth();
  const { budgets, transactions } = useUserData();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "daily" as BudgetType,
    period: "Harian",
    category: "",
    amount: 0,
    startDate: todayISODate(),
    endDate: todayISODate()
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await saveBudget({ ...form, userId: profile.id, category: form.type === "category" ? form.category : undefined });
      toast.success("Budget disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan budget");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Budget Monitoring" />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <label>Tipe budget</label>
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as BudgetType })}>
                <option value="daily">Budget harian</option>
                <option value="weekly">Budget mingguan</option>
                <option value="monthly">Budget bulanan</option>
                <option value="category">Budget per kategori</option>
              </select>
            </div>
            {form.type === "category" ? (
              <div className="space-y-2">
                <label>Kategori</label>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
            ) : null}
            <div className="space-y-2">
              <label>Nominal budget</label>
              <input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label>Mulai</label>
                <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              </div>
              <div className="space-y-2">
                <label>Selesai</label>
                <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </div>
            </div>
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" />
              Simpan Budget
            </Button>
          </form>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const spent = transactions
              .filter((item) => item.type === "expense")
              .filter((item) => !budget.category || item.category === budget.category)
              .filter((item) => item.date >= budget.startDate && item.date <= budget.endDate)
              .reduce((sum, item) => sum + item.amount, 0);
            const progress = budget.amount ? (spent / budget.amount) * 100 : 0;
            const status = calculateBudgetStatus(spent, budget.amount);
            return (
              <Card key={budget.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{budget.category || budget.period || budget.type}</p>
                    <p className="text-sm text-slate-500">{budget.startDate} sampai {budget.endDate}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(status)}`}>{status}</span>
                </div>
                <div className="mt-5 space-y-2">
                  <ProgressBar value={progress} />
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(spent, profile?.currency)}</span>
                    <span>{formatCurrency(budget.amount, profile?.currency)}</span>
                  </div>
                </div>
                {status === "Waspada" ? <p className="mt-3 text-sm text-amber-600">Alert: budget hampir habis.</p> : null}
                {status === "Overbudget" ? <p className="mt-3 text-sm text-rose-600">Alert: overbudget.</p> : null}
              </Card>
            );
          })}
          {!budgets.length ? <EmptyState title="Budget belum dibuat" description="Tambahkan budget harian, mingguan, bulanan, atau per kategori." /> : null}
        </div>
      </div>
    </div>
  );
}
