export type TransactionType = "expense" | "income";
export type Wallet = "Cash" | "Bank" | "E-wallet" | "Kartu Kredit";
export type BudgetType = "daily" | "weekly" | "monthly" | "category";
export type Frequency = "daily" | "weekly" | "monthly";
export type BudgetStatus = "Aman" | "Waspada" | "Overbudget";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  currency: string;
  spreadsheetId?: string;
  autoSync: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  wallet: Wallet;
  description: string;
  date: string;
  receiptUrl?: string;
  sheetRowId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: string;
  userId: string;
  type: BudgetType;
  period: string;
  category?: string;
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type RecurringExpense = {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  wallet: Wallet;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyClosing = {
  id: string;
  userId: string;
  date: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  notes: string;
  confirmedAt: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  userId: string;
  action:
    | "login"
    | "add_transaction"
    | "edit_transaction"
    | "delete_transaction"
    | "sync_spreadsheet"
    | "daily_closing";
  entityType: "user" | "transaction" | "spreadsheet" | "closing" | "budget" | "recurring";
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
};

export type SpreadsheetSettings = {
  spreadsheetId?: string;
  autoSync: boolean;
  lastSyncAt?: string;
};
