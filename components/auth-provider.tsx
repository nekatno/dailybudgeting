"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { auth, signInWithGoogle, userToProfile, logout as firebaseLogout } from "@/lib/firebase";
import { addAuditLog, subscribeUser, upsertUser } from "@/lib/repositories";
import type { UserProfile } from "@/lib/types";
import { nowISO } from "@/lib/utils";

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  login: () => Promise<void>;
  connectGoogleSheets: () => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setProfile(null);
      return undefined;
    }
    return subscribeUser(firebaseUser.uid, setProfile);
  }, [firebaseUser]);

  async function login() {
    try {
      const result = await signInWithGoogle();
      const timestamp = nowISO();
      await upsertUser({
        ...userToProfile(result.user),
        id: result.user.uid,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      await addAuditLog({
        userId: result.user.uid,
        action: "login",
        entityType: "user",
        entityId: result.user.uid,
        newValue: { email: result.user.email }
      });
      setAccessToken(result.accessToken ?? null);
      toast.success("Login berhasil");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login Google gagal";
      toast.error(message);
      throw error;
    }
  }

  async function connectGoogleSheets() {
    try {
      const result = await signInWithGoogle();
      setFirebaseUser(result.user);
      setAccessToken(result.accessToken ?? null);
      if (!result.accessToken) {
        toast.error("Google tidak mengirim token Sheets. Coba login ulang dan izinkan akses spreadsheet.");
        return null;
      }
      toast.success("Akses Google Sheets tersambung");
      return result.accessToken;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyambungkan Google Sheets";
      toast.error(message);
      return null;
    }
  }

  async function logout() {
    await firebaseLogout();
    setAccessToken(null);
    toast.success("Logout berhasil");
  }

  const value = useMemo(
    () => ({ firebaseUser, profile, accessToken, loading, login, connectGoogleSheets, logout }),
    [firebaseUser, profile, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
