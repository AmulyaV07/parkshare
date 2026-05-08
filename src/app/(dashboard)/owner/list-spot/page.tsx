"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { createParkingSpot } from "@/lib/firestore";
import type { ParkingSpot } from "@/types";
import { Navbar } from "@/components/shared/Navbar";

const MapPinPicker = dynamic(
  () => import("@/components/map/MapPinPicker").then((m) => m.MapPinPicker),
  { ssr: false },
);

const VEHICLE_TYPES = ["car", "bike", "truck"] as const;

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-zinc-900">{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export default function ListSpotPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState(19.076); // Mumbai default
  const [lng, setLng] = useState(72.8777);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["car"]);
  const [isCovered, setIsCovered] = useState(false);
  const [hasEVCharging, setHasEVCharging] = useState(false);
  const [hasCCTV, setHasCCTV] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(120);
  const [dailyRate, setDailyRate] = useState<number>(800);
  const [availableFrom, setAvailableFrom] = useState("08:00");
  const [availableTo, setAvailableTo] = useState("22:00");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      !!user &&
      title.trim().length > 2 &&
      address.trim().length > 4 &&
      description.trim().length > 5 &&
      vehicleTypes.length > 0 &&
      hourlyRate > 0 &&
      dailyRate > 0 &&
      availableFrom.length > 0 &&
      availableTo.length > 0
    );
  }, [
    address,
    availableFrom,
    availableTo,
    dailyRate,
    description,
    hourlyRate,
    title,
    user,
    vehicleTypes.length,
  ]);

  async function uploadImages(spotId: string) {
    if (!files.length) return [];
    const urls: string[] = [];

    for (let i = 0; i < Math.min(files.length, 5); i += 1) {
      const file = files[i];
      const fileRef = ref(storage, `parkingSpots/${spotId}/${i}-${file.name}`);
      const task = uploadBytesResumable(fileRef, file);
      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setUploadProgress(pct);
          },
          reject,
          () => resolve(),
        );
      });
      urls.push(await getDownloadURL(task.snapshot.ref));
    }

    return urls;
  }

  async function onSubmit() {
    if (!user) {
      toast.error("Please sign in again.");
      router.replace("/login");
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);

      const spotBase: ParkingSpot = {
        ownerId: user.uid,
        ownerName: user.displayName ?? "Owner",
        title: title.trim(),
        address: address.trim(),
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        vehicleTypes,
        isCovered,
        hasEVCharging,
        hasCCTV,
        baseHourlyRate: hourlyRate,
        baseDailyRate: dailyRate,
        availableFrom,
        availableTo,
        images: [],
        isActive: true,
        totalBookings: 0,
        averageRating: 0,
      };

      const spotId = await createParkingSpot(spotBase);
      let imageUrls: string[] = [];
      try {
        imageUrls = await uploadImages(spotId);
      } catch (err) {
        const code = (err as { code?: string } | undefined)?.code ?? "";
        if (code.includes("storage/")) {
          toast.error(
            "Firebase Storage isn’t enabled (or needs billing). Spot was created without photos.",
          );
        } else {
          toast.error("Image upload failed. Spot was created without photos.");
        }
        imageUrls = [];
      }

      if (imageUrls.length) {
        // best-effort: update spot with images (no helper yet)
        const { updateDoc, doc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await updateDoc(doc(db, "parkingSpots", spotId), { images: imageUrls });
      }

      toast.success("Spot listed!");
      router.replace("/owner");
    } catch (e) {
      toast.error("Could not list spot. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              List a parking spot
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Fill the details below. Photos are optional (max 5).
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hourly rate (INR)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Daily rate (INR)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Available from</Label>
                    <Input
                      type="time"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Available to</Label>
                    <Input
                      type="time"
                      value={availableTo}
                      onChange={(e) => setAvailableTo(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Vehicle types</Label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {VEHICLE_TYPES.map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-2 text-sm text-zinc-700"
                      >
                        <input
                          type="checkbox"
                          checked={vehicleTypes.includes(t)}
                          onChange={(e) => {
                            setVehicleTypes((prev) =>
                              e.target.checked
                                ? Array.from(new Set([...prev, t]))
                                : prev.filter((x) => x !== t),
                            );
                          }}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={isCovered}
                      onChange={(e) => setIsCovered(e.target.checked)}
                    />
                    Covered
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={hasEVCharging}
                      onChange={(e) => setHasEVCharging(e.target.checked)}
                    />
                    EV Charging
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={hasCCTV}
                      onChange={(e) => setHasCCTV(e.target.checked)}
                    />
                    CCTV
                  </label>
                </div>

                <div>
                  <Label>Images (up to 5)</Label>
                  <input
                    className="mt-2 block w-full text-sm text-zinc-700"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const list = Array.from(e.target.files ?? []);
                      setFiles(list.slice(0, 5));
                    }}
                  />
                  {files.length ? (
                    <div className="mt-2 text-xs text-zinc-500">
                      Selected: {files.map((f) => f.name).join(", ")}
                    </div>
                  ) : null}
                </div>

                {submitting && files.length ? (
                  <div className="text-xs text-zinc-600">
                    Uploading images: {uploadProgress}%
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    onClick={() => router.push("/owner")}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit || submitting}
                    className="flex-1 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onSubmit}
                  >
                    {submitting ? "Listing..." : "List spot"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium text-zinc-900">
                Pick location (drag the map)
              </div>
              <MapPinPicker
                latitude={lat}
                longitude={lng}
                onChange={(a, b) => {
                  setLat(Number(a.toFixed(6)));
                  setLng(Number(b.toFixed(6)));
                }}
              />
              <div className="mt-2 text-xs text-zinc-600">
                Lat: {lat}, Lng: {lng}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

