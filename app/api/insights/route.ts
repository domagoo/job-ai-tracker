// app/api/insights/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(v: any): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function ymd(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function pct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

type Tip = {
  title: string;
  body: string;
  severity: "high" | "medium" | "low";
  metric?: string;
};

export async function GET() {
  const now = new Date();

  // Applications
  const apps = await prisma.application.findMany({
    select: { id: true, status: true, createdAt: true, updatedAt: true },
  });

  // Events (for time-per-stage)
  const events = await prisma.applicationEvent.findMany({
    where: { type: { in: ["CREATED", "STATUS_CHANGE"] } },
    orderBy: [{ applicationId: "asc" }, { createdAt: "asc" }],
    select: {
      applicationId: true,
      type: true,
      fromStatus: true,
      toStatus: true,
      createdAt: true,
    },
  });

  const totalApplications = apps.length;

  /* ---------------- Status counts ---------------- */
  const byStatus: Record<Status, number> = {
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
  };

  for (const app of apps) {
    if (isStatus(app.status)) byStatus[app.status]++;
  }

  /* ---------------- Avg days in pipeline (meaningful) ----------------
     Using "age since createdAt" for all apps.
  */
  let totalAge = 0;
  for (const app of apps) totalAge += daysBetween(app.createdAt, now);

  const avgDaysInPipeline =
    totalApplications > 0 ? totalAge / totalApplications : 0;

  /* ---------------- Funnel conversion rates ---------------- */
  const funnel = {
    appliedToInterview:
      byStatus.APPLIED > 0 ? byStatus.INTERVIEW / byStatus.APPLIED : 0,
    interviewToOffer:
      byStatus.INTERVIEW > 0 ? byStatus.OFFER / byStatus.INTERVIEW : 0,
    offerToAccepted:
      byStatus.OFFER > 0
        ? (byStatus.OFFER - byStatus.REJECTED) / byStatus.OFFER
        : 0,
  };

  /* ---------------- Activity: daily created last 30 days ---------------- */
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const counts = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    counts.set(ymd(d), 0);
  }

  for (const app of apps) {
    const k = ymd(app.createdAt);
    if (counts.has(k)) counts.set(k, (counts.get(k) || 0) + 1);
  }

  const dailyCreated = Array.from(counts.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  /* ---------------- Time per Stage (avg per reached app) ---------------- */
  // Group events by applicationId
  const byApp = new Map<number, typeof events>();
  for (const e of events) {
    const arr = byApp.get(e.applicationId) ?? [];
    arr.push(e);
    byApp.set(e.applicationId, arr);
  }

  // Totals across all apps: sum durations + how many apps reached stage
  const durationSum: Record<Status, number> = {
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
  };

  const reachedCount: Record<Status, number> = {
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
  };

  for (const app of apps) {
    const appEvents = byApp.get(app.id) ?? [];

    // Determine start status/time
    let currentStatus: Status = isStatus(app.status) ? app.status : "APPLIED";
    let currentTime: Date = app.createdAt;

    // If we have a CREATED event, use its toStatus (more accurate)
    const created = appEvents.find((x) => x.type === "CREATED");
    if (created?.toStatus && isStatus(created.toStatus)) {
      currentStatus = created.toStatus;
      currentTime = created.createdAt;
    }

    // Track reached stages
    const reached = new Set<Status>();
    reached.add(currentStatus);

    // Walk status changes in time order
    for (const e of appEvents) {
      if (e.type !== "STATUS_CHANGE") continue;
      if (!e.toStatus || !isStatus(e.toStatus)) continue;

      // Add duration in the previous status until this change
      const dt = daysBetween(currentTime, e.createdAt);
      durationSum[currentStatus] += dt;

      // Move forward
      currentStatus = e.toStatus;
      currentTime = e.createdAt;
      reached.add(currentStatus);
    }

    // Add time from last known point to now (time in current stage)
    durationSum[currentStatus] += daysBetween(currentTime, now);

    // Increment reached counters
    for (const s of reached) reachedCount[s] += 1;
  }

  const avgTimePerStageRaw: Record<Status, number> = {
    APPLIED: reachedCount.APPLIED
      ? durationSum.APPLIED / reachedCount.APPLIED
      : 0,
    INTERVIEW: reachedCount.INTERVIEW
      ? durationSum.INTERVIEW / reachedCount.INTERVIEW
      : 0,
    OFFER: reachedCount.OFFER ? durationSum.OFFER / reachedCount.OFFER : 0,
    REJECTED: reachedCount.REJECTED
      ? durationSum.REJECTED / reachedCount.REJECTED
      : 0,
  };

  const avgTimePerStage: Record<Status, number> = {
    APPLIED: Number(avgTimePerStageRaw.APPLIED.toFixed(1)),
    INTERVIEW: Number(avgTimePerStageRaw.INTERVIEW.toFixed(1)),
    OFFER: Number(avgTimePerStageRaw.OFFER.toFixed(1)),
    REJECTED: Number(avgTimePerStageRaw.REJECTED.toFixed(1)),
  };

  /* ---------------- Insight-driven tips (PM-level signal) ----------------
     IMPORTANT: These are computed safely and do NOT change any other fields.
  */
  const tips: Tip[] = [];

  // Tip 1: Biggest bottleneck stage (only if you have event coverage)
  const bottleneck = (Object.keys(avgTimePerStage) as Status[])
    .map((s) => ({ s, days: avgTimePerStage[s], reached: reachedCount[s] }))
    .filter((x) => x.reached > 0);

  if (bottleneck.length > 0) {
    bottleneck.sort((a, b) => b.days - a.days);
    const top = bottleneck[0];

    if (top.days >= 7) {
      tips.push({
        title: `Bottleneck: ${top.s} stage is slow`,
        body: `On average, applications spend ${top.days} days in ${top.s}. Consider tightening your next-step cadence (follow-ups, scheduling, or batching outreach).`,
        severity: "high",
        metric: `${top.days}d in ${top.s}`,
      });
    } else if (top.days >= 3) {
      tips.push({
        title: `Pipeline drag: ${top.s} is your slowest stage`,
        body: `Apps spend about ${top.days} days in ${top.s}. If you want faster throughput, focus on reducing wait time in this stage.`,
        severity: "medium",
        metric: `${top.days}d in ${top.s}`,
      });
    } else {
      tips.push({
        title: `Healthy pacing`,
        body: `Your slowest stage is ${top.s} at ~${top.days} days. That’s fairly quick—keep the cadence consistent.`,
        severity: "low",
        metric: `${top.days}d in ${top.s}`,
      });
    }
  } else {
    tips.push({
      title: "Enable time-per-stage tracking",
      body: "No stage timing data yet. Make sure ApplicationEvent rows are being created on create + status moves in Kanban.",
      severity: "high",
    });
  }

  // Tip 2: Funnel improvements (use safe denominators)
  const a2i = funnel.appliedToInterview;
  const i2o = funnel.interviewToOffer;

  if (byStatus.APPLIED >= 5 && a2i < 0.2) {
    tips.push({
      title: "Low Applied → Interview conversion",
      body: `Only ${pct(a2i)}% of applied items are reaching interview. Consider targeting better-fit roles, refining your resume per role type, or increasing outreach quality.`,
      severity: "high",
      metric: `${pct(a2i)}% Applied→Interview`,
    });
  } else if (byStatus.INTERVIEW >= 3 && i2o < 0.25) {
    tips.push({
      title: "Interview → Offer is your biggest lever",
      body: `Only ${pct(i2o)}% of interviews convert to offers. Focus on interview reps, story prep, and role-aligned project examples.`,
      severity: "medium",
      metric: `${pct(i2o)}% Interview→Offer`,
    });
  } else if (byStatus.INTERVIEW >= 3 && i2o >= 0.25) {
    tips.push({
      title: "Interview performance looks promising",
      body: `Your Interview → Offer rate is ${pct(i2o)}%. Keep repeating what works: prep patterns, system design reps, and strong closing questions.`,
      severity: "low",
      metric: `${pct(i2o)}% Interview→Offer`,
    });
  }

  // Tip 3: Stale pipeline (avg age)
  if (totalApplications >= 5) {
    if (avgDaysInPipeline >= 21) {
      tips.push({
        title: "Your pipeline may be stale",
        body: `Average application age is ${avgDaysInPipeline.toFixed(
          1
        )} days. Consider closing out older applications and refreshing with new ones weekly.`,
        severity: "high",
        metric: `${avgDaysInPipeline.toFixed(1)} avg days`,
      });
    } else if (avgDaysInPipeline >= 10) {
      tips.push({
        title: "Moderate pipeline age",
        body: `Average age is ${avgDaysInPipeline.toFixed(
          1
        )} days. Add a follow-up routine (e.g., 2/5/10 day check-ins) to reduce stagnation.`,
        severity: "medium",
        metric: `${avgDaysInPipeline.toFixed(1)} avg days`,
      });
    } else {
      tips.push({
        title: "Fresh pipeline",
        body: `Average age is ${avgDaysInPipeline.toFixed(
          1
        )} days — your tracking is up to date. Keep feeding the top of funnel.`,
        severity: "low",
        metric: `${avgDaysInPipeline.toFixed(1)} avg days`,
      });
    }
  }

  return NextResponse.json({
    totalApplications,
    byStatus,
    avgDaysInPipeline: Number(avgDaysInPipeline.toFixed(1)),
    funnel,
    dailyCreated,
    avgTimePerStage,
    reachedCount,

    // ✅ NEW — but does not break existing shape
    tips,
  });
}
