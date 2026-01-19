// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import ToastBridge from "./ToastBridge";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Application = {
  id: number | string; // ✅ allow API to return string, we’ll coerce safely
  company: string;
  role: string;
  status: string;
  location: string | null;
  jobUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/applications", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setApplications(data);
      } catch {
        if (!cancelled) setApplications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function openDetails(appId: number | string) {
    const id = Number(appId);
    if (!Number.isFinite(id)) {
      console.warn("Invalid application id from API:", appId);
      return;
    }
    router.push(`/applications/${id}`);
  }

  return (
    <main className="min-h-dvh text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      {/* ✅ NEW: mirror-glass tint across the entire page background */}
      <div
        className="mirror-bg"
        aria-hidden="true"
      />

      <ToastBridge />

      <div className="mx-auto w-[min(1100px,92vw)] py-10">
        {/* Header */}
        <section className="relative grid gap-4">
          <div className="hero-glow" aria-hidden="true" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-2 text-white/70">
                Manage applications, review AI feedback, and track progress.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                className="btn-glass btn-ghost"
                href={process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://michaelwilliams.dev"}
                target="_blank"
                rel="noreferrer"
              >
                Back to Portfolio
              </a>


              <Link className="btn-glass" href="/kanban">
                Open Kanban
              </Link>

              {/* ✅ NEW: Insights */}
              <Link className="btn-glass btn-ghost" href="/insights">
                Insights
              </Link>

              <Link className="btn-glass btn-ghost" href="/applications/new">
                Add Application
              </Link>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {/* Recent applications */}
          <div className="glass-card lg:col-span-2">
            <div className="glass-card__glow" aria-hidden="true" />
            <h2 className="text-lg font-extrabold tracking-tight">
              Recent applications
            </h2>

            {loading ? (
              <div className="mt-5 text-white/70">Loading…</div>
            ) : applications.length === 0 ? (
              <div className="mt-5 text-white/70">
                <p className="font-semibold text-white">No applications yet</p>
                <p className="mt-1">Start by adding your first application.</p>

                <div className="mt-4 flex gap-3">
                  <Link className="btn-glass" href="/applications/new">
                    Add your first application
                  </Link>
                  <Link className="btn-glass btn-ghost" href="/kanban">
                    View Kanban
                  </Link>

                  {/* ✅ NEW: Insights (empty state shortcut) */}
                  <Link className="btn-glass btn-ghost" href="/insights">
                    View Insights
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {applications.map((a) => (
                  <div
                    key={String(a.id)}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetails(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDetails(a.id);
                      }
                    }}
                    className="feature hover:brightness-110 transition cursor-pointer"
                    aria-label={`Open ${a.company} ${a.role}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="featureTitle">
                        {a.company} — {a.role}
                      </div>
                      <span className="pill">{a.status}</span>
                    </div>

                    <div className="featureText mt-1">
                      {a.location ? `📍 ${a.location}` : "📍 Location not set"}

                      {a.jobUrl ? (
                        <>
                          {" • "}
                          <a
                            href={a.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4 text-white/80 hover:text-white"
                            onClick={(e) => e.stopPropagation()} // ✅ prevents opening details page
                          >
                            Job link
                          </a>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="glass-card">
            <div className="glass-card__glow alt" aria-hidden="true" />
            <h2 className="text-lg font-extrabold tracking-tight">
              Quick actions
            </h2>

            <div className="mt-4 grid gap-3">
              <Link className="btn-glass w-full text-center" href="/kanban">
                Open Kanban
              </Link>

              {/* ✅ NEW: Insights */}
              <Link
                className="btn-glass btn-ghost w-full text-center"
                href="/insights"
              >
                View Insights
              </Link>

              <Link
                className="btn-glass btn-ghost w-full text-center"
                href="/applications/new"
              >
                Add Application
              </Link>

              <Link
                className="btn-glass btn-ghost w-full text-center"
                href="/ai-summary"
              >
                AI Summary
              </Link>

              <Link href="/ai-coach" className="btn-glass btn-ghost">
                AI Coach
              </Link>

              <Link
                href="/ai-followup"
                className="glass-card mirror-glass hover:scale-[1.02] transition"
              >
                <h3 className="text-lg font-bold">AI Follow-up Email</h3>
                <p className="mt-1 text-sm text-white/65">
                  Generate a professional follow-up email after interviews.
                </p>
              </Link>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Tip: Keep your “glass” look consistent by using the same utility
              classes for buttons and cards across routes.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
