"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

export default function NewApplicationPage() {
  const router = useRouter();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("APPLIED");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          status,
          location: location || null,
          jobUrl: jobUrl || null,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create application");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh text-white">
      {/* Background + overlay */}
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(900px,92vw)] py-10">
        <section className="relative grid gap-5">
          <div className="hero-glow" aria-hidden="true" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Add Application
              </h1>
              <p className="mt-2 text-white/70">
                Save a job you applied to and track it on the dashboard + Kanban.
              </p>
            </div>

            <div className="flex gap-3">
              <a className="btn-glass btn-ghost" href="/dashboard">
                Back
              </a>
              <a className="btn-glass btn-ghost" href="/kanban">
                Kanban
              </a>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card__glow" aria-hidden="true" />
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Company</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-white/70">Role</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label 
                    htmlFor="status"
                    className="text-sm text-white/70">Status</label>
                  <select
                    id ="status"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm text-white/70">Location (optional)</label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Remote / Charlotte, NC"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-white/70">Job URL (optional)</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="btn-glass"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Application"}
                </button>

                <button
                  className="btn-glass btn-ghost"
                  type="button"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
