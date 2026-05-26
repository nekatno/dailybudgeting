"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/components/auth-provider";
import { Button, Card } from "@/components/ui";
import { categories, wallets } from "@/lib/constants";
import { listTransactions, createTransaction, updateTransaction, updateUserSettings } from "@/lib/repositories";
import { appendTransactionToSheet, rewriteTransactionsSheet } from "@/lib/sheets";
import { uploadReceipt } from "@/lib/storage";
import type { Transaction } from "@/lib/types";
import { todayISODate } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce.number().positive("Nominal wajib lebih dari 0"),
  category: z.string().min(1, "Kategori wajib diisi"),
  wallet: z.enum(["Cash", "Bank", "E-wallet", "Kartu Kredit"]),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  receipt: z.custom<FileList>((value) => typeof FileList === "undefined" || value instanceof FileList).optional()
});

type FormValues = z.infer<typeof schema>;

export function TransactionForm({ transaction, onSaved }: { transaction?: Transaction; onSaved?: () => void }) {
  const router = useRouter();
  const { profile, accessToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction ?? {
      type: "expense",
      amount: 0,
      category: "Makanan",
      wallet: "Cash",
      description: "",
      date: todayISODate()
    }
  });

  async function onSubmit(values: FormValues) {
    if (!profile) return;
    setSaving(true);
    try {
      const receiptUrl = await uploadReceipt(profile.id, values.receipt?.[0]);
      const payload = {
        type: values.type,
        amount: values.amount,
        category: values.category,
        wallet: values.wallet,
        description: values.description,
        date: values.date,
        receiptUrl
      };
      if (transaction) {
        const updated = await updateTransaction(transaction, { ...payload, receiptUrl: receiptUrl ?? transaction.receiptUrl });
        if (profile.autoSync && profile.spreadsheetId && accessToken) {
          const allTransactions = await listTransactions(profile.id);
          await rewriteTransactionsSheet(profile.spreadsheetId, allTransactions.map((item) => (item.id === updated.id ? updated : item)), profile, accessToken);
          await updateUserSettings(profile.id, { lastSyncAt: new Date().toISOString() });
        }
        toast.success("Transaksi diperbarui");
        onSaved?.();
      } else {
        const saved = await createTransaction({
          userId: profile.id,
          type: payload.type,
          amount: payload.amount,
          category: payload.category,
          wallet: payload.wallet,
          description: payload.description,
          date: payload.date,
          receiptUrl
        });
        if (profile.autoSync && profile.spreadsheetId && accessToken) {
          await appendTransactionToSheet(profile.spreadsheetId, saved, profile, accessToken);
          await updateUserSettings(profile.id, { lastSyncAt: new Date().toISOString() });
        }
        toast.success("Transaksi disimpan");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan transaksi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label>Tipe transaksi</label>
          <select {...register("type")}>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
        <div className="space-y-2">
          <label>Nominal</label>
          <input type="number" min="0" step="1000" {...register("amount")} />
          {errors.amount ? <p className="text-xs text-rose-600">{errors.amount.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label>Kategori</label>
          <select {...register("category")}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label>Wallet/account</label>
          <select {...register("wallet")}>
            {wallets.map((wallet) => <option key={wallet}>{wallet}</option>)}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label>Deskripsi</label>
          <input {...register("description")} />
          {errors.description ? <p className="text-xs text-rose-600">{errors.description.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label>Tanggal</label>
          <input type="date" {...register("date")} />
        </div>
        <div className="space-y-2">
          <label>Upload struk opsional</label>
          <input type="file" accept="image/*,.pdf" {...register("receipt")} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" />
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}
