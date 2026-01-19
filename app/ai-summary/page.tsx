// app/ai-summary/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type Application = {
  id: number;
  company: string;
  role: string;
  status: string;
  aiSummary?: string | null;
};

export default function AISummaryPage() {
  const toast = useToast();

  const [apps, setApps] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- fetch applications ---------------- */
  useEffect(() => {
    fetch("/api/applications", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setApps(Array.isArray(json) ? json : []))
      .catch(() => setApps([]));
  }, []);

  function asInt(v: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  const selectedApp = useMemo(() => {
    if (!selectedId) return null;
    return apps.find((a) => a.id === selectedId) || null;
  }, [apps, selectedId]);

  const hasSaved = !!selectedApp?.aiSummary;
  const isDirty = !!selectedApp && (selectedApp.aiSummary ?? "") !== (summary ?? "");

  /* ---------------- when selection changes: load saved summary if present ---------------- */
  useEffect(() => {
    setError(null);

    if (!selectedApp) {
      setSummary("");
      return;
    }

    // show saved summary if it exists
    setSummary(selectedApp.aiSummary ?? "");
  }, [selectedApp]);

  /* ---------------- generate summary ---------------- */
  async function generate() {
    if (!selectedId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: selectedId }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error || "Failed to generate summary.";
        setError(msg);
        toast.error(msg);
        return;
      }

      setSummary(json.summary ?? "");
      toast.success("Summary generated ✅");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate summary.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- save summary (PATCH /api/applications) ---------------- */
  async function saveSummary() {
    if (!selectedId || !summary.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, aiSummary: summary.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error || "Failed to save summary.";
        setError(msg);
        toast.error(msg);
        return;
      }

      // Update local apps list so pill + selection persistence works
      setApps((prev) =>
        prev.map((a) => (a.id === selectedId ? { ...a, aiSummary: summary.trim() } : a))
      );

      toast.success("Summary saved to database ✅");
    } catch (e: any) {
      const msg = e?.message || "Failed to save summary.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-app" />
      <div className="fixed inset-0 -z-10 bg-overlay" />

      <div className="mx-auto w-[min(1100px,92vw)] py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI Summary</h1>
            <p className="mt-1 text-white/65">
              Generate a recruiter-friendly summary per application (2–4 sentences).
            </p>
          </div>

          <Link href="/dashboard" className="btn-glass btn-ghost">
            Back to Dashboard
          </Link>
        </div>

        {/* Content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* LEFT — SELECT */}
          <div className="glass-card mirror-glass">
            <h2 className="text-lg font-extrabold">Select application</h2>
            <p className="mt-1 text-sm text-white/60">
              Choose one to generate (and optionally save) an AI summary.
            </p>

            <div className="mt-4 relative">
              <select
                className="
                  w-full
                  rounded-xl
                  px-4 py-3
                  bg-white/10
                  text-white
                  backdrop-blur-xl
                  border border-white/20
                  shadow-lg
                  outline-none
                  transition
                  focus:ring-2 focus:ring-white/30
                  focus:border-white/40
                  appearance-none
                "
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(asInt(e.target.value))}
                aria-label="Select application"
              >
                <option value="" disabled className="bg-[#0b0f1a] text-white/50">
                  Select…
                </option>

                {apps.map((a) => (
                  <option
                    key={a.id}
                    value={a.id}
                    className="bg-[#0b0f1a] text-white hover:bg-white/10"
                  >
                    {a.company} — {a.role} ({a.status})
                  </option>
                ))}
              </select>

              {/* dropdown arrow */}
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                ▾
              </span>
            </div>

            <button
              onClick={generate}
              disabled={!selectedId || loading}
              className="btn-glass mt-4 w-full disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate AI Summary"}
            </button>

            {/* Feedback (optional inline, toast already shows too) */}
            {error ? (
              <div className="mt-3 feature mirror-card">
                <div className="text-sm font-semibold text-white/85">Error</div>
                <div className="mt-1 text-sm text-white/70">{error}</div>
              </div>
            ) : null}
          </div>

          {/* RIGHT — OUTPUT */}
          <div className="glass-card mirror-glass">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Output</h2>
              <span className="pill !py-0.5 !px-2 text-[11px]">
                {!selectedApp
                  ? "—"
                  : !summary
                  ? "Not generated"
                  : hasSaved && !isDirty
                  ? "Saved"
                  : hasSaved && isDirty
                  ? "Edited"
                  : "Not saved"}
              </span>
            </div>

            <p className="mt-1 text-sm text-white/60">
              You can edit the text before saving (optional).
            </p>

            <div className="mt-4 feature mirror-card min-h-[180px]">
              {summary ? (
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="
                    w-full h-full
                    bg-transparent
                    text-white
                    resize-none
                    outline-none
                    text-sm
                  "
                  aria-label="AI summary output"
                />
              ) : (
                <div className="text-white/60">
                  Pick an application on the left to generate an AI summary.
                </div>
              )}
            </div>

            <button
              onClick={saveSummary}
              disabled={!selectedId || !summary.trim() || saving}
              className="btn-glass mt-4 w-full disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Summary to Database"}
            </button>

            <div className="mt-2 text-xs text-white/55">
              Tip: Generate → optionally edit → Save.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
