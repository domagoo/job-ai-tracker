// app/api/ai/coach/compare/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function pctDelta(current: number, previous: number) {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function GET() {
  try {
    const [latest7, latest30] = await Promise.all([
      prisma.coachReport.findFirst({
        where: { rangeDays: 7 },
        orderBy: { createdAt: "desc" },
      }),
      prisma.coachReport.findFirst({
        where: { rangeDays: 30 },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const delta = {
      totalApplications:
        latest7 && latest30 ? latest7.totalApplications - latest30.totalApplications : null,
      avgDaysInPipeline:
        latest7 && latest30 ? Number(latest7.avgDaysInPipeline) - Number(latest30.avgDaysInPipeline) : null,
      reachedCount:
        latest7 && latest30 ? Number(latest7.reachedCount) - Number(latest30.reachedCount) : null,
      pct:
        latest7 && latest30
          ? {
              totalApplications: pctDelta(latest7.totalApplications, latest30.totalApplications),
              avgDaysInPipeline: pctDelta(Number(latest7.avgDaysInPipeline), Number(latest30.avgDaysInPipeline)),
              reachedCount: pctDelta(Number(latest7.reachedCount), Number(latest30.reachedCount)),
            }
          : null,
    };

    // Basic “What to do next”
    const actionCards =
      latest7
        ? [
            {
              title: "Keep momentum",
              body:
                "Your pipeline looks balanced. Keep a steady cadence: apply to 3–5 quality roles/week, follow up within 24 hours after interviews, and keep projects updated.",
              priority: "low" as const,
            },
          ]
        : [];

    return NextResponse.json({
      latest7,
      latest30,
      delta,
      actionCards,
    });
  } catch (err) {
    console.error("Coach compare error:", err);
    return NextResponse.json({ error: "Failed to load compare" }, { status: 500 });
  }
}
