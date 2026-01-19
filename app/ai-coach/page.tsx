// app/ai-coach/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type CoachHistoryRow = {
  id: number;
  rangeDays: number;
  totalApplications: number;
  avgDaysInPipeline: number;
  reachedCount: number;
  title: string;
  createdAt: string;
};

type CompareResponse = {
  latest7: any | null;
  latest30: any | null;
  delta: {
    totalApplications: number | null;
    avgDaysInPipeline: number | null;
    reachedCount: number | null;
    pct:
      | {
          totalApplications: number | null;
          avgDaysInPipeline: number | null;
          reachedCount: number | null;
        }
      | null;
  };
  actionCards: Array<{
    title: string;
    body: string;
    priority: "high" | "medium" | "low";
  }>;
};

type FullCoachReport = {
  id: number;
  rangeDays: number;
  totalApplications: number;
  byStatus: any;
  dailyCreated: any;
  funnel: any;
  avgDaysInPipeline: number;
  avgTimePerStage: any;
  reachedCount: number;
  title: string;
  summary: string;
  priorities: any;
  createdAt: string;
};

function fmtPct(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}%`;
}

function fmtDelta(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  return isInt ? `${sign}${n}` : `${sign}${n.toFixed(1)}`;
}

function pillForPriority(p: "high" | "medium" | "low") {
  if (p === "high") return "bg-red-500/10 text-red-100 border-red-300/20";
  if (p === "medium") return "bg-amber-500/10 text-amber-100 border-amber-300/20";
  return "bg-emerald-500/10 text-emerald-100 border-emerald-300/20";
}

function safePrettyJson(v: any) {
  try {
    return JSON.stringify(v ?? null, null, 2);
  } catch {
    return String(v);
  }
}

/** ✅ NEW: nicer “By status” rendering */
function StatusList({ byStatus }: { byStatus: Record<string, number> | null | undefined }) {
  const entries = Object.entries(byStatus ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  if (!entries.length) {
    return <div className="mt-2 text-sm text-white/60">No status data.</div>;
  }

  return (
    <div className="mt-2 grid gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-white/80">{k}</span>
          <span className="font-extrabold text-white">{Number(v ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

/** ✅ NEW: nicer “Daily created” rendering */
function DailyCreatedList({
  dailyCreated,
}: {
  dailyCreated: Record<string, number> | null | undefined;
}) {
  // sort by date string, and hide zeros
  const entries = Object.entries(dailyCreated ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, v]) => Number(v ?? 0) > 0);

  if (!entries.length) {
    return <div className="mt-2 text-sm text-white/60">No new applications in this range.</div>;
  }

  return (
    <div className="mt-2 grid gap-2">
      {entries.map(([date, count]) => (
        <div key={date} className="flex items-center justify-between text-sm">
          <span className="text-white/80">{date}</span>
          <span className="font-extrabold text-white">{Number(count ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

/** ✅ NEW: nicer “Funnel” rendering */
function FunnelList({ funnel }: { funnel: Record<string, number> | null | undefined }) {
  const entries = Object.entries(funnel ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  if (!entries.length) {
    return <div className="mt-2 text-sm text-white/60">No funnel data.</div>;
  }

  return (
    <div className="mt-2 grid gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-white/80">{k}</span>
          <span className="font-extrabold text-white">{Number(v ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AICoachPage() {
  const toast = useToast();

  const [compare, setCompare] = useState<CompareResponse | null>(null);
  const [history, setHistory] = useState<CoachHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerReport, setDrawerReport] = useState<FullCoachReport | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [cRes, hRes] = await Promise.all([
        fetch("/api/ai/coach/compare", { cache: "no-store" }),
        fetch("/api/ai/coach/history?take=30", { cache: "no-store" }),
      ]);

      const cText = await cRes.text();
      const hText = await hRes.text();

      const cJson = cText ? JSON.parse(cText) : null;
      const hJson = hText ? JSON.parse(hText) : null;

      if (!cRes.ok) throw new Error(cJson?.error || "Failed to load compare");
      if (!hRes.ok) throw new Error(hJson?.error || "Failed to load history");

      setCompare(cJson);
      setHistory(Array.isArray(hJson) ? hJson : []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load coach insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openFullReport(id: number) {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerReport(null);

    try {
      const res = await fetch(`/api/ai/coach/report/${id}`, { cache: "no-store" });

      const text = await res.text();
      if (!text) throw new Error("Empty response from server");

      const json = JSON.parse(text);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load report");
      }

      setDrawerReport(json);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load report");
    } finally {
      setDrawerLoading(false);
    }
  }

  const latest7 = compare?.latest7;
  const latest30 = compare?.latest30;
  const hasCompare = !!latest7 && !!latest30;

  const metrics = useMemo(() => {
    return [
      {
        label: "Applications (7 vs 30)",
        a: latest7?.totalApplications ?? null,
        b: latest30?.totalApplications ?? null,
        d: compare?.delta.totalApplications ?? null,
        p: compare?.delta.pct?.totalApplications ?? null,
      },
      {
        label: "Avg days in pipeline",
        a: latest7?.avgDaysInPipeline ?? null,
        b: latest30?.avgDaysInPipeline ?? null,
        d: compare?.delta.avgDaysInPipeline ?? null,
        p: compare?.delta.pct?.avgDaysInPipeline ?? null,
      },
      {
        label: "Reached count",
        a: latest7?.reachedCount ?? null,
        b: latest30?.reachedCount ?? null,
        d: compare?.delta.reachedCount ?? null,
        p: compare?.delta.pct?.reachedCount ?? null,
      },
    ];
  }, [compare, latest7, latest30]);

  return (
    <main className="min-h-dvh text-white">
      <div className="fixed inset-0 -z-10 bg-app" />
      <div className="fixed inset-0 -z-10 bg-overlay" />

      {/* Drawer overlay */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[9998]">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[min(520px,92vw)] glass-card mirror-glass !rounded-none !p-5 overflow-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-extrabold">Full coach report</div>
              <button
                type="button"
                className="btn-glass btn-ghost"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </button>
            </div>

            {drawerLoading ? (
              <div className="mt-4 feature mirror-card text-sm text-white/70">
                Loading report…
              </div>
            ) : !drawerReport ? (
              <div className="mt-4 feature mirror-card text-sm text-white/70">
                No report loaded.
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                <div className="feature mirror-card">
                  <div className="text-sm font-extrabold text-white/90">
                    {drawerReport.title || `Coach report #${drawerReport.id}`}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Range: {drawerReport.rangeDays}d • Created:{" "}
                    {new Date(drawerReport.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-white/70 leading-relaxed">
                    {drawerReport.summary}
                  </div>
                </div>

                {/* ✅ CHANGE #1: remove JSON <pre>, use StatusList */}
                <div className="feature mirror-card">
                  <div className="text-sm font-extrabold text-white/90">By status</div>
                  <StatusList byStatus={drawerReport.byStatus} />
                </div>

                {/* ✅ CHANGE #2: remove JSON <pre>, use DailyCreatedList */}
                <div className="feature mirror-card">
                  <div className="text-sm font-extrabold text-white/90">Daily created</div>
                  <DailyCreatedList dailyCreated={drawerReport.dailyCreated} />
                </div>

                {/* ✅ CHANGE #3: remove JSON <pre>, use FunnelList */}
                <div className="feature mirror-card">
                  <div className="text-sm font-extrabold text-white/90">Funnel</div>
                  <FunnelList funnel={drawerReport.funnel} />
                </div>

                {/* If you still want raw JSON for debugging, keep this optional block */}
                {/* 
                <div className="feature mirror-card">
                  <div className="text-sm font-extrabold text-white/90">Raw JSON (debug)</div>
                  <pre className="mt-2 text-xs text-white/70 overflow-auto">
                    {safePrettyJson(drawerReport)}
                  </pre>
                </div> 
                */}
              </div>
            )}
          </aside>
        </div>
      ) : null}

      <div className="mx-auto w-[min(1100px,92vw)] py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI Insights Coach</h1>
            <p className="mt-1 text-white/65">
              Review trends, see what changed, and get next actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="btn-glass btn-ghost" disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <Link href="/dashboard" className="btn-glass btn-ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Compare */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="glass-card mirror-glass">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Trend comparison</h2>
              <span className="pill !py-0.5 !px-2 text-[11px]">
                {hasCompare ? "7 vs 30" : "Needs reports"}
              </span>
            </div>

            <p className="mt-1 text-sm text-white/60">
              Compares your latest saved 7-day report to your latest saved 30-day report.
            </p>

            {!hasCompare ? (
              <div className="mt-4 feature mirror-card">
                <div className="text-sm font-semibold text-white/85">No comparison yet</div>
                <div className="mt-1 text-sm text-white/70">
                  Save at least one CoachReport with <b>rangeDays=7</b> and one with{" "}
                  <b>rangeDays=30</b>.
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="feature mirror-card flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white/85">{m.label}</div>
                      <div className="mt-1 text-xs text-white/60">
                        7-day: <span className="text-white/80">{m.a ?? "—"}</span> • 30-day:{" "}
                        <span className="text-white/80">{m.b ?? "—"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white/90">{fmtDelta(m.d)}</div>
                      <div className="text-xs text-white/60">{fmtPct(m.p)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Cards */}
          <div className="glass-card mirror-glass">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">What to do next</h2>
              <span className="pill !py-0.5 !px-2 text-[11px]">
                {compare?.actionCards?.length ? `${compare.actionCards.length} cards` : "—"}
              </span>
            </div>

            <p className="mt-1 text-sm text-white/60">
              Suggested actions based on your latest 7-day report.
            </p>

            <div className="mt-4 grid gap-3">
              {(compare?.actionCards ?? []).map((c, idx) => (
                <div key={idx} className="feature mirror-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-white/90">{c.title}</div>
                    <span
                      className={[
                        "pill !py-0.5 !px-2 text-[11px] border",
                        pillForPriority(c.priority),
                      ].join(" ")}
                    >
                      {c.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-white/70 leading-relaxed">{c.body}</div>
                </div>
              ))}

              {!compare?.actionCards?.length ? (
                <div className="feature mirror-card text-sm text-white/70">
                  Generate and save a 7-day report to get action cards.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="mt-6 glass-card mirror-glass">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Coach history</h2>
            <span className="pill !py-0.5 !px-2 text-[11px]">
              {history.length ? `${history.length} saved` : "None"}
            </span>
          </div>

          <p className="mt-1 text-sm text-white/60">
            Your saved coach reports (most recent first). Click one to expand.
          </p>

          <div className="mt-4 grid gap-2">
            {history.map((h) => {
              const isOpen = openId === h.id;

              return (
                <div key={h.id} className="feature mirror-card">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : h.id)}
                    className="w-full text-left hover:bg-white/5 transition rounded-xl"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-extrabold text-white/90">
                          {h.title || `Coach report #${h.id}`}
                        </div>
                        <div className="mt-1 text-xs text-white/60">
                          Range: {h.rangeDays}d • Created:{" "}
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <span className="pill !py-0.5 !px-2 text-[11px]">
                        {h.totalApplications} apps
                      </span>
                    </div>

                    {isOpen ? (
                      <div className="mt-3 grid gap-2 text-sm text-white/70">
                        <div>
                          <span className="text-white/85 font-semibold">Avg days in pipeline:</span>{" "}
                          {h.avgDaysInPipeline}
                        </div>
                        <div>
                          <span className="text-white/85 font-semibold">Reached count:</span>{" "}
                          {h.reachedCount}
                        </div>
                      </div>
                    ) : null}
                  </button>

                  {isOpen ? (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="btn-glass btn-ghost"
                        onClick={() => openFullReport(h.id)}
                      >
                        View full report
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {!history.length ? (
              <div className="feature mirror-card text-sm text-white/70">
                No saved coach reports yet. Generate + save one to see history here.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 text-xs text-white/55">
          Tip: To compare 7 vs 30, you need at least one saved report for each range.
        </div>
      </div>
    </main>
  );
}
