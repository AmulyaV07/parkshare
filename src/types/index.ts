import type { Timestamp } from "firebase/firestore";

export type UserRole = "driver" | "owner";

export type BookingStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled"
  | "overstaying";

export type PaymentStatus = "mock_paid" | "pending";

export type DamageClaimStatus = "none" | "pending" | "resolved";

export type ConflictStatus = "pending" | "accepted" | "rejected" | "expired";

export type Severity = "none" | "minor" | "moderate" | "severe";

export type DamageRecommendation = "dismiss" | "investigate" | "compensate";

export type UrgencyLevel = "low" | "medium" | "high";

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: UserRole;
  createdAt: Timestamp;
  behaviorScore: number; // 0-100
  blockedBy: string[]; // owner UIDs
}

export interface ParkingSpot {
  spotId?: string;
  ownerId: string;
  ownerName: string;
  title: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  vehicleTypes: string[]; // car, bike, truck
  isCovered: boolean;
  hasEVCharging: boolean;
  hasCCTV: boolean;
  baseHourlyRate: number; // INR
  baseDailyRate: number; // INR
  availableFrom: string; // HH:mm
  availableTo: string; // HH:mm
  images: string[]; // Storage URLs
  isActive: boolean;
  totalBookings: number;
  averageRating: number;
}

export interface ExtensionRequest {
  requestedAt: Timestamp;
  extensionHours: number;
  status: "pending" | "approved" | "denied";
  resolvedAt?: Timestamp | null;
  aiSummary?: string;
}

export interface DamageReport {
  damageDetected: boolean;
  confidenceScore: number; // 0-100
  suspectedDamageAreas: string[];
  severity: Severity;
  estimatedRepairCost: number; // INR
  recommendation: DamageRecommendation;
  aiRemarks: string;
}

export interface AlternateSpot {
  spotId: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  hourlyRate: number;
  distanceKm?: number;
  etaMinutes?: number;
}

export interface Booking {
  bookingId: string;
  spotId: string;
  spotTitle: string;
  spotAddress: string;
  driverId: string;
  driverName: string;
  ownerId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  durationHours: number;
  baseRate: number;
  aiSurgeMultiplier: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  extensionRequests: ExtensionRequest[];
  entryVideoURL: string | null;
  exitVideoURL: string | null;
  damageClaimStatus: DamageClaimStatus;
  damageReport: DamageReport | null;
  createdAt: Timestamp;
}

export interface ConflictRequest {
  conflictId?: string;
  currentBookingId: string;
  nextBookingId: string;
  currentDriverId: string;
  nextDriverId: string;
  spotId: string;
  extensionHours: number;
  status: ConflictStatus;
  compensationOffer: number;
  alternateSpots: AlternateSpot[];
  createdAt: Timestamp;
  resolvedAt: Timestamp | null;
}


