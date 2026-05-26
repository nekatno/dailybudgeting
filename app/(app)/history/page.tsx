"use client";

import { Edit2, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TransactionForm } from "@/components/transaction-form";
import { Button, Card, EmptyState, PageHeader, SecondaryButton } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { categories, wallets } from "@/lib/constants";
import { useUserData } from "@/lib/hooks";
import { listTransactions, removeTransaction, updateUserSettings } from "@/lib/repositories";
import { rewriteTransactionsSheet } from "@/lib/sheets";
import type { Transaction, TransactionType, Wallet } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const { profile, accessToken } = useAuth();
  const { transactions } = useUserData();
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [wallet, setWallet] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = useMemo(
    () =>
      transactions.filter((item) => {
        const matchesDate = !date || item.date === date;
        const matchesCategory = !category || item.category === category;
        const matchesWallet = !wallet || item.wallet === wallet;
        const matchesType = !type || item.type === type;
        const matchesSearch = !search || item.description.toLowerCase().includes(search.toLowerCase());
        return matchesDate && matchesCategory && matchesWallet && matchesType && matchesSearch;
      }),
    [transactions, date, category, wallet, type, search]
  );

  async function handleDelete(transaction: Transaction) {
    if (!profile || !confirm("Hapus transaksi ini?")) return;
    try {
      await removeTransaction(transaction);
      if (profile.autoSync && profile.spreadsheetId && accessToken) {
        const remaining = (await listTransactions(profile.id)).filter((item) => item.id !== transaction.id);
        await rewriteTransactionsSheet(profile.spreadsheetId, remaining, profile, accessToken);
        await updateUserSettings(profile.id, { lastSyncAt: new Date().toISOString() });
      }
      toast.success("Transaksi dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus transaksi");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Riwayat Transaksi" />
      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={wallet} onChange={(event) => setWallet(event.target.value as Wallet)}>
            <option value="">Semua wallet</option>
            {wallets.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value as TransactionType)}>
            <option value="">Semua tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="pl-9" placeholder="Search deskripsi" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {filtered.length ? (
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Wallet</th>
                <th>Deskripsi</th>
                <th>Nominal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.type === "expense" ? "Pengeluaran" : "Pemasukan"}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.wallet}</td>
                  <td>{transaction.description}</td>
                  <td className={transaction.type === "expense" ? "text-rose-600" : "text-brand-600"}>{formatCurrency(transaction.amount, profile?.currency)}</td>
                  <td>
                    <div className="flex gap-2">
                      <SecondaryButton className="min-h-9 px-3" onClick={() => setEditing(transaction)} aria-label="Edit transaksi">
                        <Edit2 className="h-4 w-4" />
                      </SecondaryButton>
                      <SecondaryButton className="min-h-9 px-3 text-rose-600" onClick={() => handleDelete(transaction)} aria-label="Hapus transaksi">
                        <Trash2 className="h-4 w-4" />
                      </SecondaryButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="Belum ada transaksi" description="Ubah filter atau tambah transaksi baru." />
        )}
      </Card>

      {editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
          <div className="mx-auto max-w-3xl space-y-3 pt-10">
            <div className="flex justify-end">
              <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
                Tutup
              </Button>
            </div>
            <TransactionForm transaction={editing} onSaved={() => setEditing(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
