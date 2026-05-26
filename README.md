# Daily Budget Monitoring

Mobile-first web app untuk monitoring budget harian dengan Next.js, Firebase Auth, Firestore, Firebase Storage, dan Google Sheets API.

## Fitur

- Login/logout Google dengan scope `https://www.googleapis.com/auth/spreadsheets`
- Dashboard budget, pengeluaran, sisa budget, status budget, grafik, transaksi terakhir, dan notifikasi
- Form transaksi pemasukan/pengeluaran dengan upload struk opsional
- Auto append transaksi ke Google Spreadsheet saat `autoSync` aktif
- Riwayat transaksi dengan filter, search, edit, delete, audit log, dan re-sync spreadsheet
- Budget harian, mingguan, bulanan, dan per kategori dengan progress bar serta alert
- Recurring expense, closing harian, spreadsheet settings, profile, dan activity timeline

## Environment

Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi Firebase:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Aktifkan di Google Cloud/Firebase:

- Firebase Authentication provider Google
- Firestore Database
- Firebase Storage untuk upload struk
- Google Sheets API

## Jalankan

```bash
npm install
npm run dev
```

## Struktur Firestore

- `users/{userId}`
- `transactions/{transactionId}`
- `budgets/{budgetId}`
- `recurringExpenses/{recurringId}`
- `dailyClosings/{closingId}`
- `auditLogs/{logId}`

Kolom Google Sheets transaksi:

`Tanggal | Tipe | Kategori | Wallet | Deskripsi | Nominal | User | Created At | Updated At`
