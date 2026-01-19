// app/api/applications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(v: any): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

function asInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  const apps = await prisma.application.findMany({
    orderBy: [{ createdAt: "desc" }],
    // Return only what the UI needs (includes aiSummary)
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      location: true,
      jobUrl: true,
      createdAt: true,
      updatedAt: true,
      aiSummary: true,
    },
  });

  return NextResponse.json(apps);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const company = String(body.company ?? "").trim();
  const role = String(body.role ?? "").trim();
  const status = body.status ?? "APPLIED";
  const location = body.location ? String(body.location) : null;
  const jobUrl = body.jobUrl ? String(body.jobUrl) : null;

  if (!company || !role) {
    return NextResponse.json(
      { error: "Company and role are required" },
      { status: 400 }
    );
  }
  if (!isStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Create app
  const app = await prisma.application.create({
    data: {
      company,
      role,
      status,
      location,
      jobUrl,
    },
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      location: true,
      jobUrl: true,
      createdAt: true,
      updatedAt: true,
      aiSummary: true,
    },
  });

  // Log CREATED event (enables time-per-stage)
  await prisma.applicationEvent.create({
    data: {
      applicationId: app.id,
      type: "CREATED",
      toStatus: app.status,
    },
  });

  return NextResponse.json(app);
}

/**
 * PATCH: Update small fields like aiSummary without replacing the whole record.
 * Body:
 * {
 *   "id": number,
 *   "aiSummary": string | null
 * }
 */
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));

  const id = asInt(body.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const aiSummary =
    body.aiSummary === null || body.aiSummary === undefined
      ? null
      : String(body.aiSummary).trim();

  const updated = await prisma.application.update({
    where: { id },
    data: { aiSummary },
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      location: true,
      jobUrl: true,
      createdAt: true,
      updatedAt: true,
      aiSummary: true,
    },
  });

  return NextResponse.json(updated);
}
