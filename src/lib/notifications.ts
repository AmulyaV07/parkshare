import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType =
  | "booking_confirmed"
  | "booking_starting_soon"
  | "overstay_detected"
  | "extension_conflict_request"
  | "conflict_resolved"
  | "tow_escalation"
  | "damage_claim_submitted";

export async function createNotification(
  uid: string,
  type: NotificationType,
  message: string,
  metadata?: Record<string, unknown>,
) {
  if (!uid) return;
  await addDoc(collection(db, "notifications", uid, "items"), {
    uid,
    type,
    message,
    metadata: metadata ?? {},
    read: false,
    createdAt: serverTimestamp(),
  });
}

