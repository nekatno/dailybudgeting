"use client";

import { PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/transaction-form";

export default function NewTransactionPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Tambah Transaksi" />
      <TransactionForm />
    </div>
  );
}
