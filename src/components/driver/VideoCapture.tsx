"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export function VideoCapture({
  open,
  bookingId,
  mode,
  message,
  onClose,
  onUploaded,
}: {
  open: boolean;
  bookingId: string;
  mode: "entry" | "exit";
  message: string;
  onClose: () => void;
  onUploaded?: (url: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!alive) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Camera permission failed");
      }
    };
    void start();

    return () => {
      alive = false;
      setReady(false);
      setRecording(false);
      chunksRef.current = [];
      recorderRef.current?.stop?.();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-zinc-950">
              Record {mode === "entry" ? "Entry" : "Exit"} Video
            </div>
            <div className="mt-1 text-xs text-zinc-500">{message}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            disabled={uploading}
          >
            Close
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-black">
          <video ref={videoRef} className="h-[280px] w-full object-cover" muted playsInline />
        </div>

        {uploading ? (
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-zinc-900"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-zinc-600">Uploading... {progress}%</div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={!ready || recording || uploading}
            onClick={() => {
              try {
                const stream = streamRef.current;
                if (!stream) return;
                const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
                chunksRef.current = [];
                recorder.ondataavailable = (ev) => {
                  if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
                };
                recorderRef.current = recorder;
                recorder.start();
                setRecording(true);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not start recording");
              }
            }}
          >
            Start Recording
          </button>

          <button
            type="button"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-60"
            disabled={!recording || uploading}
            onClick={async () => {
              try {
                const recorder = recorderRef.current;
                if (!recorder) return;

                await new Promise<void>((resolve) => {
                  recorder.onstop = () => resolve();
                  recorder.stop();
                });
                setRecording(false);

                const blob = new Blob(chunksRef.current, { type: "video/webm" });
                if (!blob.size) throw new Error("No video captured");

                setUploading(true);
                const path = `bookings/${bookingId}/${mode}.webm`;
                const storageRef = ref(storage, path);
                const task = uploadBytesResumable(storageRef, blob, { contentType: "video/webm" });

                await new Promise<void>((resolve, reject) => {
                  task.on(
                    "state_changed",
                    (snap) => {
                      const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                      setProgress(pct);
                    },
                    (err) => reject(err),
                    () => resolve(),
                  );
                });

                const url = await getDownloadURL(storageRef);
                await updateDoc(doc(db, "bookings", bookingId), {
                  [mode === "entry" ? "entryVideoURL" : "exitVideoURL"]: url,
                });

                toast.success("Video uploaded");
                onUploaded?.(url);
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Upload failed");
              } finally {
                setUploading(false);
              }
            }}
          >
            Stop & Upload
          </button>
        </div>
      </div>
    </div>
  );
}

