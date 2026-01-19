import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(v: any): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const status = body.status;
  const orderedIds = body.orderedIds;

  if (!isStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds must be a non-empty array" }, { status: 400 });
  }

  const ids = orderedIds.map((x: any) => Number(x));
  if (ids.some((n: number) => !Number.isFinite(n))) {
    return NextResponse.json({ error: "orderedIds must be numbers" }, { status: 400 });
  }

  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    return NextResponse.json({ error: "orderedIds contains duplicates" }, { status: 400 });
  }

  // Ensure all ids exist (optional but recommended)
  const existing = await prisma.application.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  if (existing.length !== ids.length) {
    return NextResponse.json({ error: "One or more ids do not exist" }, { status: 400 });
  }

  // ✅ single transaction: status + order are set consistently
  await prisma.$transaction(
    ids.map((id, idx) =>
      prisma.application.update({
        where: { id },
        data: { status, order: idx },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
