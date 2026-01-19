// app/dashboard/ToastBridge.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";

export default function ToastBridge() {
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");
  const toast = useToast();

  // prevent double-firing in React Strict Mode
  const firedRef = useRef(false);

  useEffect(() => {
    if (!toastKey) return;
    if (firedRef.current) return;
    firedRef.current = true;

    if (toastKey === "deleted") toast.success("Application deleted.");
    else if (toastKey === "created") toast.success("Application created.");
    else if (toastKey === "updated") toast.success("Application updated.");
    else toast.info("Done.");

    // ✅ remove ?toast=... WITHOUT navigation (no rerender/race)
    const url = new URL(window.location.href);
    url.searchParams.delete("toast");
    window.history.replaceState({}, "", url.toString());
  }, [toastKey, toast]);

  return null;
}
