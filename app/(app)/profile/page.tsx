"use client";

import { LogOut, Save } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, PageHeader, SecondaryButton } from "@/components/ui";
import { updateUserSettings } from "@/lib/repositories";

export default function ProfilePage() {
  const { profile, logout } = useAuth();
  const [currency, setCurrency] = useState(profile?.currency ?? "IDR");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateUserSettings(profile.id, { currency });
      toast.success("Profile disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" />
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          {profile?.photoURL ? <Image src={profile.photoURL} alt={profile.name} width={88} height={88} className="rounded-full" /> : null}
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold">{profile?.name}</p>
            <p className="text-slate-500">{profile?.email}</p>
          </div>
          <SecondaryButton onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </SecondaryButton>
        </div>
        <div className="mt-6 max-w-sm space-y-2">
          <label>Pengaturan currency</label>
          <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="IDR">IDR - Rupiah</option>
            <option value="USD">USD - US Dollar</option>
            <option value="SGD">SGD - Singapore Dollar</option>
          </select>
          <Button onClick={save} loading={saving}>
            <Save className="h-4 w-4" />
            Simpan Profile
          </Button>
        </div>
      </Card>
    </div>
  );
}
