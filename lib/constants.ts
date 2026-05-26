import type { Wallet } from "@/lib/types";

export const categories = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Kesehatan",
  "Hiburan",
  "Gaji",
  "Investasi",
  "Lainnya"
];

export const wallets: Wallet[] = ["Cash", "Bank", "E-wallet", "Kartu Kredit"];

export const sheetHeaders = [
  "Tanggal",
  "Tipe",
  "Kategori",
  "Wallet",
  "Deskripsi",
  "Nominal",
  "User",
  "Created At",
  "Updated At"
];
