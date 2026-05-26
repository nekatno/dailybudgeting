"use client";

import {
  Activity,
  CalendarCheck,
  CreditCard,
  History,
  Home,
  LogOut,
  Moon,
  PlusCircle,
  Repeat,
  Settings,
  Sheet,
  Sun,
  UserCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button, SecondaryButton } from "@/components/ui";
import { cn } from "@/lib/utils";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/transactions/new", label: "Tambah", icon: PlusCircle },
  { href: "/history", label: "Riwayat", icon: History },
  { href: "/budget", label: "Budget", icon: CreditCard },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/closing", label: "Closing", icon: CalendarCheck },
  { href: "/spreadsheet", label: "Spreadsheet", icon: Sheet },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: UserCircle }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, login, logout } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Memuat aplikasi...</div>;
  }

  if (!profile) {
    return (
      <main className="grid min-h-screen bg-slate-50 px-5 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-md flex-col justify-center">
          <div className="mb-8">
            <p className="text-sm font-semibold text-brand-600">Daily Budget Monitoring</p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal">Pantau budget harian dan sync ke Google Sheets.</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Login dengan Google untuk menyimpan transaksi, audit log, closing harian, dan spreadsheet pribadi.
            </p>
          </div>
          <Button onClick={login}>Login dengan Google</Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="flex items-center gap-3 px-2 py-3">
          {profile.photoURL ? <Image src={profile.photoURL} alt={profile.name} width={40} height={40} className="rounded-full" /> : null}
          <div className="min-w-0">
            <p className="truncate font-semibold">{profile.name}</p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
          </div>
        </div>
        <nav className="mt-5 space-y-1">
          {menu.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
          <SecondaryButton onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </SecondaryButton>
          <SecondaryButton onClick={logout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </SecondaryButton>
        </div>
      </aside>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 lg:ml-72 lg:px-8 lg:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        {menu.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 px-1 py-2 text-[11px]", active ? "text-brand-600" : "text-slate-500")}>
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        className="fixed bottom-20 right-4 rounded-full bg-slate-900 p-3 text-white shadow-soft dark:bg-white dark:text-slate-950 lg:hidden"
        onClick={() => router.push("/transactions/new")}
        aria-label="Tambah transaksi"
      >
        <PlusCircle className="h-6 w-6" />
      </button>
      <button
        className="fixed right-4 top-4 rounded-full border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
        onClick={() => setDark((value) => !value)}
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
