"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { categories, wallets } from "@/lib/constants";
import { useUserData } from "@/lib/hooks";
import { saveRecurring } from "@/lib/repositories";
import type { Frequency, Wallet } from "@/lib/types";
import { formatCurrency, todayISODate } from "@/lib/utils";

export default function RecurringPage() {
  const { profile } = useAuth();
  const { recurring } = useUserData();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: 0,
    category: "Tagihan",
    wallet: "Bank" as Wallet,
    frequency: "monthly" as Frequency,
    startDate: todayISODate(),
    endDate: "",
    isActive: true
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await saveRecurring({ ...form, userId: profile.id, endDate: form.endDate || undefined });
      toast.success("Recurring expense disimpan");
      setForm({ ...form, name: "", amount: 0 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan recurring expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Recurring Expense" />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <label>Nama transaksi</label>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label>Nominal</label>
              <input type="number" min="0" required value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
            </div>
            <div className="space-y-2">
              <label>Kategori</label>
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label>Wallet</label>
              <select value={form.wallet} onChange={(event) => setForm({ ...form, wallet: event.target.value as Wallet })}>
                {wallets.map((wallet) => <option key={wallet}>{wallet}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label>Frekuensi</label>
              <select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as Frequency })}>
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label>Tanggal mulai</label>
                <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              </div>
              <div className="space-y-2">
                <label>Tanggal selesai</label>
                <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input className="h-4 w-4" type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Status aktif
            </label>
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </form>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {recurring.map((item) => (
            <Card key={item.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.category} - {item.wallet}</p>
                </div>
                <span className={item.isActive ? "text-sm font-semibold text-brand-600" : "text-sm text-slate-500"}>{item.isActive ? "Aktif" : "Nonaktif"}</span>
              </div>
              <p className="mt-4 text-2xl font-bold">{formatCurrency(item.amount, profile?.currency)}</p>
              <p className="mt-1 text-sm text-slate-500">{item.frequency} mulai {item.startDate}</p>
              {item.isActive ? <p className="mt-3 text-sm text-amber-600">Reminder: cek jatuh tempo recurring expense.</p> : null}
            </Card>
          ))}
          {!recurring.length ? <EmptyState title="Belum ada recurring expense" description="Tambahkan transaksi berulang untuk pengeluaran rutin." /> : null}
        </div>
      </div>
    </div>
  );
}
