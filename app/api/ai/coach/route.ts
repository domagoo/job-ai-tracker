// app/api/ai/coach/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type StatusKey = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const {
      rangeDays,
      totalApplications,
      byStatus,
      dailyCreated,
      funnel,
      avgDaysInPipeline,
      avgTimePerStage,
      reachedCount, // Record<StatusKey, number>
      title,
      summary,
      priorities,
      save = true,
    } = payload;

    let savedId: number | null = null;

    const reachedCountTotal = Object.values(
      (reachedCount ?? {}) as Record<StatusKey, number>
    ).reduce((sum, n) => sum + Number(n || 0), 0);

    if (save) {
      const saved = await prisma.coachReport.create({
        data: {
          rangeDays,
          totalApplications,
          byStatus,
          dailyCreated,
          funnel,
          avgDaysInPipeline: Number(Number(avgDaysInPipeline).toFixed(1)),
          avgTimePerStage,
          reachedCount: reachedCountTotal,
          title,
          summary,
          priorities,
        },
        select: { id: true },
      });

      savedId = saved.id;
    }

    return NextResponse.json({ ok: true, savedId });
  } catch (err: any) {
    console.error("AI Coach error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate coach report" },
      { status: 500 }
    );
  }
}
