"use client";

import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useAppStore, type UserRole } from "@/store/useAppStore";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function useAuth() {
  const setUser = useAppStore((s) => s.setUser);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const user = useAppStore((s) => s.user);
  const userRole = useAppStore((s) => s.userRole);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser ?? null);

      if (!nextUser) {
        setUserRole(null);
        clearCookie("ps_uid");
        setLoading(false);
        return;
      }

      setCookie("ps_uid", nextUser.uid, 60 * 60 * 24 * 7);

      const userRef = doc(db, "users", nextUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(
          userRef,
          {
            uid: nextUser.uid,
            name: nextUser.displayName ?? "",
            email: nextUser.email ?? "",
            photoURL: nextUser.photoURL ?? "",
            role: null,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
        setUserRole(null);
        setLoading(false);
        return;
      }

      const data = snap.data() as { role?: UserRole | null } | undefined;
      setUserRole(data?.role ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, [setUser, setUserRole]);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    clearCookie("ps_uid");
    setUser(null);
    setUserRole(null);
  }, [setUser, setUserRole]);

  return useMemo(
    () => ({
      user,
      userRole,
      loading,
      signInWithGoogle,
      signOut: signOutUser,
    }),
    [loading, signInWithGoogle, signOutUser, user, userRole],
  );
}


