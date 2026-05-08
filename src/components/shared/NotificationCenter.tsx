"use client";

import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, limit, onSnapshot, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type NotificationItem = {
  id: string;
  message: string;
  type: string;
  read?: boolean;
  createdAt?: { toMillis?: () => number };
};

export function NotificationCenter({ uid }: { uid: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "notifications", uid, "items"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationItem, "id">) }));
      next.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setItems(next);
    });
    return () => unsub();
  }, [uid]);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  if (!uid) return null;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-xl border border-zinc-200 p-2 hover:bg-zinc-50"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4 text-zinc-700" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[90] w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700">
            Notifications
          </div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <div className="px-3 py-5 text-center">
                <svg
                  viewBox="0 0 120 80"
                  className="mx-auto h-14 w-20 text-zinc-400"
                  fill="none"
                  aria-hidden
                >
                  <path d="M20 58h80l-8-12V34a32 32 0 10-64 0v12l-8 12z" stroke="currentColor" />
                  <path d="M52 66a8 8 0 0016 0" stroke="currentColor" />
                </svg>
                <div className="mt-2 text-sm font-medium text-zinc-700">No notifications</div>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={[
                    "block w-full border-b border-zinc-100 px-3 py-2.5 text-left",
                    n.read ? "bg-white" : "bg-zinc-50",
                  ].join(" ")}
                  onClick={async () => {
                    if (!uid) return;
                    await updateDoc(doc(db, "notifications", uid, "items", n.id), { read: true });
                  }}
                >
                  <div className="text-xs font-medium text-zinc-900">{n.type.replaceAll("_", " ")}</div>
                  <div className="mt-1 text-xs text-zinc-600">{n.message}</div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

