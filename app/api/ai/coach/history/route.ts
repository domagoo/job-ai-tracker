// app/api/ai/coach/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const takeParam = url.searchParams.get("take");
    const take = Math.min(Math.max(Number(takeParam || 20), 1), 100);

    const rows = await prisma.coachReport.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        rangeDays: true,
        totalApplications: true,
        avgDaysInPipeline: true,
        reachedCount: true,
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Coach history error:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
