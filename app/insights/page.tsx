// app/insights/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Status = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

type DailyPoint = { date: string; count: number }; // date: YYYY-MM-DD

type InsightsResponse = {
  totalApplications: number;
  byStatus: Record<Status, number>;
  avgDaysInPipeline: number;
  funnel: {
    appliedToInterview: number;
    interviewToOffer: number;
    offerToAccepted: number;
  };

  // OPTIONAL (for charts)
  dailyCreated?: DailyPoint[]; // last 30 days

  // NEW: time-per-stage analytics
  avgTimePerStage?: Record<Status, number>; // avg days spent in each stage
  reachedCount?: Record<Status, number>; // how many apps ever reached the stage
};

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function fmtDays(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0d";
  if (n < 1) return "<1d";
  return `${n.toFixed(1)}d`;
}

/* ---------------- small UI helpers ---------------- */

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-card mirror-glass">
      <div className="text-sm text-white/70">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-white/90">{value}</div>
      {sub ? <div className="mt-1 text-sm text-white/60">{sub}</div> : null}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  note,
}: {
  label: string;
  value: number; // 0..1
  note?: string;
}) {
  const v = clamp(value);
  return (
    <div className="feature mirror-card">
      <div className="flex items-center justify-between gap-3">
        <div className="font-extrabold text-white/85">{label}</div>
        <div className="pill !py-0.5 !px-2 text-[11px]">{pct(v)}</div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-white/40"
          style={{ width: `${Math.round(v * 100)}%` }}
        />
      </div>

      {note ? <div className="featureText !mt-2">{note}</div> : null}
    </div>
  );
}

/* ---------------- skeletons ---------------- */

function SkeletonCard() {
  return <div className="glass-card mirror-glass skeleton h-[118px]" />;
}

function SkeletonChart({ h = 280 }: { h?: number }) {
  return (
    <div className={`glass-card mirror-glass skeleton`} style={{ height: h }} />
  );
}

function EmptyChart({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="glass-card mirror-glass">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold">{title}</h3>
        <span className="pill !py-0.5 !px-2 text-[11px]">Chart</span>
      </div>
      <div className="mt-4 featureText text-white/65">{subtitle}</div>
      <div className="mt-4 feature mirror-card">
        <div className="featureText text-white/60">
          No data yet — once you have items or events, this will populate.
        </div>
      </div>
    </div>
  );
}

/* ---------------- charts (pure SVG) ---------------- */

function StatusBarChart({
  title,
  byStatus,
  total,
}: {
  title: string;
  byStatus: Record<Status, number>;
  total: number;
}) {
  const items = useMemo(() => {
    const order: { key: Status; label: string }[] = [
      { key: "APPLIED", label: "Applied" },
      { key: "INTERVIEW", label: "Interview" },
      { key: "OFFER", label: "Offer" },
      { key: "REJECTED", label: "Rejected" },
    ];
    return order.map((o) => ({
      key: o.key,
      label: o.label,
      value: byStatus[o.key] ?? 0,
    }));
  }, [byStatus]);

  const max = Math.max(1, ...items.map((i) => i.value));

  // SVG sizing
  const W = 560;
  const H = 220;
  const padL = 34;
  const padR = 14;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const gap = 18;
  const barW = (innerW - gap * (items.length - 1)) / items.length;

  return (
    <div className="glass-card mirror-glass">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">{title}</h3>
          <div className="text-sm text-white/60 mt-1">
            Total:{" "}
            <span className="text-white/80 font-semibold">{total}</span>
          </div>
        </div>
        <span className="pill !py-0.5 !px-2 text-[11px]">Bar</span>
      </div>

      <div className="mt-4 feature mirror-card overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[240px]"
          role="img"
          aria-label="Status distribution bar chart"
        >
          {/* grid lines */}
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            return (
              <line
                key={t}
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* bars */}
          {items.map((it, idx) => {
            const x = padL + idx * (barW + gap);
            const h = (it.value / max) * innerH;
            const y = padT + (innerH - h);
            const labelY = H - 12;

            return (
              <g key={it.key}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={10}
                  fill="rgba(255,255,255,0.35)"
                />
                <text
                  x={x + barW / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.75)"
                >
                  {it.value}
                </text>
                <text
                  x={x + barW / 2}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.65)"
                >
                  {it.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 text-sm text-white/60">
        Tip: drag cards in Kanban to keep this distribution healthy.
      </div>
    </div>
  );
}

function LineChart({ title, points }: { title: string; points: DailyPoint[] }) {
  const cleaned = points
    .filter((p) => typeof p?.date === "string" && Number.isFinite(p?.count))
    .slice(-30);

  if (cleaned.length < 2) {
    return (
      <EmptyChart
        title={title}
        subtitle="This chart needs at least 2 daily points. Return `dailyCreated` from /api/insights."
      />
    );
  }

  const W = 560;
  const H = 220;
  const padL = 34;
  const padR = 14;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxY = Math.max(1, ...cleaned.map((p) => p.count));
  const minY = 0;

  const xFor = (i: number) => padL + (i / (cleaned.length - 1)) * innerW;
  const yFor = (v: number) =>
    padT + innerH - ((v - minY) / (maxY - minY || 1)) * innerH;

  const d = cleaned
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.count)}`)
    .join(" ");

  const last = cleaned[cleaned.length - 1];

  return (
    <div className="glass-card mirror-glass">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">{title}</h3>
          <div className="text-sm text-white/60 mt-1">
            Last day:{" "}
            <span className="text-white/80 font-semibold">{last.count}</span> on{" "}
            <span className="text-white/75">{last.date}</span>
          </div>
        </div>
        <span className="pill !py-0.5 !px-2 text-[11px]">Line</span>
      </div>

      <div className="mt-4 feature mirror-card overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[240px]"
          role="img"
          aria-label="Daily activity line chart"
        >
          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            return (
              <line
                key={t}
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* area fill */}
          <path
            d={`${d} L ${xFor(cleaned.length - 1)} ${padT + innerH} L ${xFor(
              0
            )} ${padT + innerH} Z`}
            fill="rgba(255,255,255,0.08)"
          />

          {/* line */}
          <path
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2"
          />

          {/* dots */}
          {cleaned.map((p, i) => (
            <circle
              key={`${p.date}_${i}`}
              cx={xFor(i)}
              cy={yFor(p.count)}
              r={3}
              fill="rgba(255,255,255,0.7)"
            />
          ))}

          {/* y-axis labels */}
          <text
            x={padL}
            y={padT + 10}
            fontSize="12"
            fill="rgba(255,255,255,0.55)"
          >
            {maxY}
          </text>
          <text
            x={padL}
            y={padT + innerH + 18}
            fontSize="12"
            fill="rgba(255,255,255,0.55)"
          >
            0
          </text>
        </svg>
      </div>

      <div className="mt-3 text-sm text-white/60">
        This shows applications created per day (last 30 days).
      </div>
    </div>
  );
}

/* ---------------- NEW: Time per Stage chart ---------------- */

function TimePerStageChart({
  avgTimePerStage,
  reachedCount,
}: {
  avgTimePerStage: Record<Status, number>;
  reachedCount: Record<Status, number>;
}) {
  const items = useMemo(() => {
    const order: { key: Status; label: string }[] = [
      { key: "APPLIED", label: "Applied" },
      { key: "INTERVIEW", label: "Interview" },
      { key: "OFFER", label: "Offer" },
      { key: "REJECTED", label: "Rejected" },
    ];
    return order.map((o) => ({
      key: o.key,
      label: o.label,
      days: Number(avgTimePerStage?.[o.key] ?? 0),
      reached: Number(reachedCount?.[o.key] ?? 0),
    }));
  }, [avgTimePerStage, reachedCount]);

  const maxDays = Math.max(1, ...items.map((i) => i.days));

  const W = 560;
  const H = 220;
  const padL = 34;
  const padR = 14;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const gap = 18;
  const barW = (innerW - gap * (items.length - 1)) / items.length;

  return (
    <div className="glass-card mirror-glass">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">Time per Stage</h3>
          <div className="text-sm text-white/60 mt-1">
            Average days spent in each stage (includes time in current stage).
          </div>
        </div>
        <span className="pill !py-0.5 !px-2 text-[11px]">Bar</span>
      </div>

      <div className="mt-4 feature mirror-card overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[240px]"
          role="img"
          aria-label="Time per stage bar chart"
        >
          {/* grid lines */}
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            return (
              <line
                key={t}
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            );
          })}

          {items.map((it, idx) => {
            const x = padL + idx * (barW + gap);
            const h = (it.days / maxDays) * innerH;
            const y = padT + (innerH - h);
            const labelY = H - 12;

            return (
              <g key={it.key}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={10}
                  fill="rgba(255,255,255,0.35)"
                />

                {/* value label */}
                <text
                  x={x + barW / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.75)"
                >
                  {fmtDays(it.days)}
                </text>

                {/* stage label */}
                <text
                  x={x + barW / 2}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.65)"
                >
                  {it.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-white/65">
        {items.map((it) => (
          <div key={it.key} className="feature mirror-card">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-white/80">{it.label}</div>
              <span className="pill !py-0.5 !px-2 text-[11px]">
                reached {it.reached}
              </span>
            </div>
            <div className="mt-2 text-white/70">
              Avg: <span className="text-white/85 font-semibold">{fmtDays(it.days)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-sm text-white/60">
        {/* If this stays at 0: make sure events are being written when you move cards in Kanban. */}
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/insights", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        setData(json);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const statusCards = useMemo(() => {
    if (!data) return [];
    const order: { key: Status; label: string }[] = [
      { key: "APPLIED", label: "Applied" },
      { key: "INTERVIEW", label: "Interview" },
      { key: "OFFER", label: "Offer" },
      { key: "REJECTED", label: "Rejected" },
    ];

    return order.map((s) => ({
      label: s.label,
      value: String(data.byStatus[s.key] ?? 0),
    }));
  }, [data]);

  const bestSignal = useMemo(() => {
    if (!data) return 0;
    return Math.max(
      data.funnel.appliedToInterview,
      data.funnel.interviewToOffer,
      data.funnel.offerToAccepted
    );
  }, [data]);

  const hasTimePerStage =
    !!data?.avgTimePerStage &&
    !!data?.reachedCount &&
    Object.keys(data.avgTimePerStage).length > 0;

  return (
    <main className="min-h-dvh text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-app" />
      <div className="fixed inset-0 -z-10 bg-overlay" />

      <div className="mx-auto w-[min(1200px,92vw)] py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Insights</h1>
            <p className="mt-1 text-white/65">
              Funnel conversion, pipeline speed, stage distribution, and activity.
            </p>
          </div>

          <Link className="btn-glass btn-ghost" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>

        {/* Top KPIs */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                label="Total applications"
                value={String(data?.totalApplications ?? 0)}
                sub="All tracked applications"
              />
              <StatCard
                label="Avg days in pipeline"
                value={`${data?.avgDaysInPipeline ?? 0}`}
                sub="Average age since created"
              />
              <StatCard
                label="Best conversion"
                value={pct(bestSignal)}
                sub="Highest conversion stage"
              />
            </>
          )}
        </div>

        {/* Charts Row 1 */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {loading ? (
            <>
              <SkeletonChart />
              <SkeletonChart />
            </>
          ) : data ? (
            <>
              <StatusBarChart
                title="Status Distribution"
                byStatus={data.byStatus}
                total={data.totalApplications}
              />

              {data.dailyCreated && data.dailyCreated.length > 0 ? (
                <LineChart title="Activity (Last 30 Days)" points={data.dailyCreated} />
              ) : (
                <EmptyChart
                  title="Activity (Last 30 Days)"
                  subtitle="Return `dailyCreated` from /api/insights to enable this chart."
                />
              )}
            </>
          ) : (
            <>
              <EmptyChart
                title="Status Distribution"
                subtitle="No data returned from /api/insights."
              />
              <EmptyChart
                title="Activity (Last 30 Days)"
                subtitle="No data returned from /api/insights."
              />
            </>
          )}
        </div>

        {/* NEW: Time per Stage */}
        <div className="mt-6">
          {loading ? (
            <SkeletonChart h={420} />
          ) : data && hasTimePerStage ? (
            <TimePerStageChart
              avgTimePerStage={data.avgTimePerStage as Record<Status, number>}
              reachedCount={data.reachedCount as Record<Status, number>}
            />
          ) : (
            <EmptyChart
              title="Time per Stage"
              subtitle="Return `avgTimePerStage` + `reachedCount` from /api/insights and ensure ApplicationEvent rows are being created."
            />
          )}
        </div>

        {/* Distribution + Funnel */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Stage distribution cards */}
          <div className="glass-card mirror-glass">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Stage distribution</h2>
              <span className="pill !py-0.5 !px-2 text-[11px]">Live</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {loading ? (
                <>
                  <div className="skeleton h-[92px]" />
                  <div className="skeleton h-[92px]" />
                  <div className="skeleton h-[92px]" />
                  <div className="skeleton h-[92px]" />
                </>
              ) : (
                statusCards.map((c) => (
                  <div key={c.label} className="feature mirror-card">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-white/85">{c.label}</div>
                      <span className="pill !py-0.5 !px-2 text-[11px]}">
                        {c.value}
                      </span>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/40"
                        style={{
                          width: `${
                            data?.totalApplications
                              ? Math.round((Number(c.value) / data.totalApplications) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="featureText !mt-2">
                      {data?.totalApplications
                        ? pct(Number(c.value) / data.totalApplications)
                        : "0%"}{" "}
                      of total
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Funnel */}
          <div className="glass-card mirror-glass">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Funnel conversion</h2>
              <span className="pill !py-0.5 !px-2 text-[11px]">Ratios</span>
            </div>

            <div className="mt-4 grid gap-3">
              {loading ? (
                <SkeletonChart h={260} />
              ) : (
                <>
                  <ProgressRow
                    label="Applied → Interview"
                    value={data?.funnel.appliedToInterview ?? 0}
                    note="How often applications move into an interview."
                  />
                  <ProgressRow
                    label="Interview → Offer"
                    value={data?.funnel.interviewToOffer ?? 0}
                    note="How often interviews convert to an offer."
                  />
                  <ProgressRow
                    label="Offer → Accepted (proxy)"
                    value={data?.funnel.offerToAccepted ?? 0}
                    note="A rough proxy until you add an Accepted status."
                  />

                  <div className="featureText text-white/60">
                    Tip: add an <span className="text-white/80">ACCEPTED</span> status later to compute true offer acceptance.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link className="btn-glass" href="/kanban">
            Open Kanban
          </Link>
          <Link className="btn-glass btn-ghost" href="/dashboard">
            Dashboard
          </Link>
          <span className="text-sm text-white/60">
            Next: status-change activity chart + weekly trend comparisons.
          </span>
        </div>
      </div>
    </main>
  );
}
