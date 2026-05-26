"use client";

import { Activity } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { useUserData } from "@/lib/hooks";
import { formatDateTime } from "@/lib/utils";

const labels: Record<string, string> = {
  login: "Login user",
  add_transaction: "Tambah transaksi",
  edit_transaction: "Edit transaksi",
  delete_transaction: "Hapus transaksi",
  sync_spreadsheet: "Sync spreadsheet",
  daily_closing: "Closing harian"
};

export default function ActivityPage() {
  const { auditLogs } = useUserData();
  return (
    <div className="space-y-5">
      <PageHeader title="Activity Timeline" />
      <Card>
        {auditLogs.length ? (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{labels[log.action] ?? log.action}</p>
                  <p className="text-sm text-slate-500">{log.entityType} - {log.entityId}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada aktivitas" description="Audit log akan mencatat login, transaksi, sync, dan closing." />
        )}
      </Card>
    </div>
  );
}
