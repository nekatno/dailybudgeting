"use client";

import { RefreshCw, Save, Sheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, PageHeader, SecondaryButton } from "@/components/ui";
import { useUserData } from "@/lib/hooks";
import { addAuditLog, updateUserSettings } from "@/lib/repositories";
import { createBudgetSpreadsheet, rewriteTransactionsSheet } from "@/lib/sheets";
import { formatDateTime } from "@/lib/utils";

export default function SpreadsheetPage() {
  const { profile, accessToken, connectGoogleSheets } = useAuth();
  const { transactions } = useUserData();
  const [spreadsheetId, setSpreadsheetId] = useState(profile?.spreadsheetId ?? "");
  const [autoSync, setAutoSync] = useState(profile?.autoSync ?? true);
  const [busy, setBusy] = useState(false);

  async function saveSettings(nextId = spreadsheetId) {
    if (!profile) return;
    await updateUserSettings(profile.id, { spreadsheetId: nextId, autoSync });
    toast.success("Pengaturan spreadsheet disimpan");
  }

  async function createSheet() {
    if (!profile) return;
    const token = accessToken ?? (await connectGoogleSheets());
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      const id = await createBudgetSpreadsheet(token);
      setSpreadsheetId(id);
      await updateUserSettings(profile.id, { spreadsheetId: id, autoSync: true, lastSyncAt: new Date().toISOString() });
      toast.success("Spreadsheet dibuat dan terhubung");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat spreadsheet");
    } finally {
      setBusy(false);
    }
  }

  async function manualSync() {
    if (!profile || !spreadsheetId) {
      toast.error("Spreadsheet ID wajib diisi");
      return;
    }
    const token = accessToken ?? (await connectGoogleSheets());
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      await rewriteTransactionsSheet(spreadsheetId, transactions, profile, token);
      const lastSyncAt = new Date().toISOString();
      await updateUserSettings(profile.id, { spreadsheetId, autoSync, lastSyncAt });
      await addAuditLog({
        userId: profile.id,
        action: "sync_spreadsheet",
        entityType: "spreadsheet",
        entityId: spreadsheetId,
        newValue: { totalRows: transactions.length, lastSyncAt }
      });
      toast.success("Sync manual selesai");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal sync spreadsheet");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Spreadsheet Settings" />
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label>Connect Google Sheets / Spreadsheet ID</label>
            <input value={spreadsheetId} onChange={(event) => setSpreadsheetId(event.target.value)} placeholder="Pilih spreadsheet existing dengan paste ID" />
          </div>
          <div className="space-y-2">
            <label>Status sync</label>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              {spreadsheetId ? "Terhubung" : "Belum terhubung"} - Sync terakhir: {formatDateTime(profile?.lastSyncAt)}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input className="h-4 w-4" type="checkbox" checked={autoSync} onChange={(event) => setAutoSync(event.target.checked)} />
            Auto sync ON/OFF
          </label>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <SecondaryButton onClick={createSheet} loading={busy}>
              <Sheet className="h-4 w-4" />
              Buat Spreadsheet
            </SecondaryButton>
            <SecondaryButton onClick={manualSync} loading={busy}>
              <RefreshCw className="h-4 w-4" />
              Sync Manual
            </SecondaryButton>
            <Button onClick={() => saveSettings()} loading={busy}>
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Format kolom spreadsheet</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Tanggal | Tipe | Kategori | Wallet | Deskripsi | Nominal | User | Created At | Updated At
        </p>
      </Card>
    </div>
  );
}
