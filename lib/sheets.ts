"use client";

import { sheetHeaders } from "@/lib/constants";
import type { DailyClosing, Transaction, UserProfile } from "@/lib/types";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SHEETS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Google Sheets request failed");
  }

  return response.json() as Promise<T>;
}

export async function createBudgetSpreadsheet(accessToken: string) {
  const result = await sheetsRequest<{ spreadsheetId: string }>("", accessToken, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: "Daily Budget Monitoring" },
      sheets: [{ properties: { title: "Transactions" } }, { properties: { title: "Daily Closings" } }]
    })
  });

  await sheetsRequest(`/${result.spreadsheetId}/values/Transactions!A1:I1?valueInputOption=RAW`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ values: [sheetHeaders] })
  });

  await sheetsRequest(`/${result.spreadsheetId}/values/Daily%20Closings!A1:H1?valueInputOption=RAW`, accessToken, {
    method: "PUT",
    body: JSON.stringify({
      values: [["Tanggal", "Total Pemasukan", "Total Pengeluaran", "Selisih", "Catatan", "User", "Confirmed At", "Created At"]]
    })
  });

  return result.spreadsheetId;
}

export async function appendTransactionToSheet(
  spreadsheetId: string,
  transaction: Transaction,
  user: UserProfile,
  accessToken: string
) {
  const row = [
    transaction.date,
    transaction.type === "expense" ? "Pengeluaran" : "Pemasukan",
    transaction.category,
    transaction.wallet,
    transaction.description,
    transaction.amount,
    user.email,
    transaction.createdAt,
    transaction.updatedAt
  ];

  await sheetsRequest(`/${spreadsheetId}/values/Transactions!A:I:append?valueInputOption=USER_ENTERED`, accessToken, {
    method: "POST",
    body: JSON.stringify({ values: [row] })
  });
}

export async function rewriteTransactionsSheet(
  spreadsheetId: string,
  transactions: Transaction[],
  user: UserProfile,
  accessToken: string
) {
  const rows = transactions.map((transaction) => [
    transaction.date,
    transaction.type === "expense" ? "Pengeluaran" : "Pemasukan",
    transaction.category,
    transaction.wallet,
    transaction.description,
    transaction.amount,
    user.email,
    transaction.createdAt,
    transaction.updatedAt
  ]);

  await sheetsRequest(`/${spreadsheetId}/values/Transactions!A:I:clear`, accessToken, { method: "POST" });
  await sheetsRequest(`/${spreadsheetId}/values/Transactions!A1:I${rows.length + 1}?valueInputOption=USER_ENTERED`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ values: [sheetHeaders, ...rows] })
  });
}

export async function appendClosingToSheet(
  spreadsheetId: string,
  closing: DailyClosing,
  user: UserProfile,
  accessToken: string
) {
  await sheetsRequest(`/${spreadsheetId}/values/Daily%20Closings!A:H:append?valueInputOption=USER_ENTERED`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      values: [[
        closing.date,
        closing.totalIncome,
        closing.totalExpense,
        closing.balance,
        closing.notes,
        user.email,
        closing.confirmedAt,
        closing.createdAt
      ]]
    })
  });
}
