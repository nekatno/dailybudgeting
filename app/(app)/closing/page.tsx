"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, PageHeader } from "@/components/ui";
import { useUserData } from "@/lib/hooks";
import { createClosing, updateUserSettings } from "@/lib/repositories";
import { appendClosingToSheet } from "@/lib/sheets";
import { formatCurrency, todayISODate } from "@/lib/utils";

export default function ClosingPage() {
  const { profile, accessToken } = useAuth();
  const { summary } = useUserData();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function confirmClosing() {
    if (!profile) return;
    setSaving(true);
    try {
      const closing = await createClosing({
        userId: profile.id,
        date: todayISODate(),
        totalIncome: summary.income,
        totalExpense: summary.expense,
        balance: summary.income - summary.expense,
        notes
      });
      if (profile.autoSync && profile.spreadsheetId && accessToken) {
        await appendClosingToSheet(profile.spreadsheetId, closing, profile, accessToken);
        await updateUserSettings(profile.id, { lastSyncAt: new Date().toISOString() });
      }
      toast.success("Closing harian dikonfirmasi");
      setNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal closing harian");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Closing Harian" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total pemasukan hari ini</p>
          <p className="mt-2 text-2xl font-bold text-brand-600">{formatCurrency(summary.income, profile?.currency)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total pengeluaran hari ini</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{formatCurrency(summary.expense, profile?.currency)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Selisih</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.income - summary.expense, profile?.currency)}</p>
        </Card>
      </div>
      <Card>
        <div className="space-y-3">
          <label>Catatan closing</label>
          <textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} />
          <Button onClick={confirmClosing} loading={saving}>
            <CheckCircle2 className="h-4 w-4" />
            Konfirmasi Closing
          </Button>
        </div>
      </Card>
    </div>
  );
}
