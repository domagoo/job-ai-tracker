// app/ai-followup/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type Application = {
  id: number;
  company: string;
  role: string;
  status: string;

  // These should match your Prisma fields
  followUpSubject?: string | null;
  followUpBody?: string | null;
};

export default function AIFollowupPage() {
  const toast = useToast();

  const [apps, setApps] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  function asInt(v: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /* ---------------- fetch applications ---------------- */
  useEffect(() => {
    fetch("/api/applications", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setApps(Array.isArray(json) ? json : []))
      .catch(() => setApps([]));
  }, []);

  const selectedApp = useMemo(() => {
    if (!selectedId) return null;
    return apps.find((a) => a.id === selectedId) || null;
  }, [apps, selectedId]);

  /* ---------------- auto-grow textarea (so you see full email) ---------------- */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    // reset then grow to content
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  /* ---------------- when selection changes: load saved email if present ---------------- */
  useEffect(() => {
    setError(null);

    if (!selectedApp) {
      setSubject("");
      setBody("");
      return;
    }

    setSubject(selectedApp.followUpSubject ?? "");
    setBody(selectedApp.followUpBody ?? "");
  }, [selectedApp]);

  /* ---------------- generate follow-up email ---------------- */
  async function generate() {
    if (!selectedId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: selectedId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Failed to generate follow-up email.");
        return;
      }

      setSubject(String(json?.subject ?? ""));
      setBody(String(json?.body ?? ""));
    } catch (e: any) {
      setError(e?.message || "Failed to generate follow-up email.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- save follow-up email ---------------- */
  async function saveEmail() {
    if (!selectedId || !subject.trim() || !body.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedId,
          save: true,
          subject,
          body,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Failed to save follow-up email.");
        return;
      }

      // Update local apps list so saved email persists on selection
      setApps((prev) =>
        prev.map((a) =>
          a.id === selectedId
            ? { ...a, followUpSubject: subject, followUpBody: body }
            : a
        )
      );

      // ✅ Option A toast: show immediately on this page
      toast.success("Email saved to database ✅");
    } catch (e: any) {
      setError(e?.message || "Failed to save follow-up email.");
      toast.error("Failed to save email.");
    } finally {
      setSaving(false);
    }
  }

  const isSaved =
    !!subject.trim() &&
    !!body.trim() &&
    !!selectedApp &&
    (selectedApp.followUpSubject ?? "") === subject &&
    (selectedApp.followUpBody ?? "") === body;

  return (
    <main className="min-h-dvh text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-app" />
      <div className="fixed inset-0 -z-10 bg-overlay" />

      <div className="mx-auto w-[min(1100px,92vw)] py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI Follow-up Email</h1>
            <p className="mt-1 text-white/65">
              Generate a professional follow-up email after applying or
              interviewing.
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
              Choose one to generate (and optionally save) a follow-up email.
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
                <option
                  value=""
                  disabled
                  className="bg-[#0b0f1a] text-white/50"
                >
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

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                ▾
              </span>
            </div>

            <button
              onClick={generate}
              disabled={!selectedId || loading}
              className="btn-glass mt-4 w-full disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate Follow-up Email"}
            </button>

            {/* Error */}
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
              <h2 className="text-lg font-extrabold">Email preview</h2>
              <span className="pill !py-0.5 !px-2 text-[11px]">
                {subject || body ? (isSaved ? "Saved" : "Not saved") : "—"}
              </span>
            </div>

            <p className="mt-1 text-sm text-white/60">
              You can edit the email before saving (optional).
            </p>

            {/* Subject */}
            <div className="mt-4 feature mirror-card">
              <div className="text-xs text-white/60 mb-2">Subject</div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="
                  w-full
                  bg-transparent
                  text-white
                  outline-none
                  text-sm
                "
                placeholder="Subject will appear here…"
                aria-label="Email subject"
              />
            </div>

            {/* Body */}
            <div className="mt-4 feature mirror-card">
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="
                  w-full
                  bg-transparent
                  text-white
                  outline-none
                  text-sm
                  resize-none
                  overflow-hidden
                  leading-relaxed
                "
                placeholder="Generate a follow-up email to preview it here…"
                aria-label="Email body"
              />
            </div>

            <button
              onClick={saveEmail}
              disabled={!selectedId || !subject.trim() || !body.trim() || saving}
              className="btn-glass mt-4 w-full disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Email to Database"}
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
