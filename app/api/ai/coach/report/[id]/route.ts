// app/api/ai/coach/report/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ IMPORTANT: await params
    const { id } = await context.params;
    const reportId = Number(id);

    if (!Number.isInteger(reportId)) {
      return NextResponse.json(
        { error: "Missing or invalid id param" },
        { status: 400 }
      );
    }

    const report = await prisma.coachReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (err) {
    console.error("GET coach report error:", err);
    return NextResponse.json(
      { error: "Failed to load coach report" },
      { status: 500 }
    );
  }
}
