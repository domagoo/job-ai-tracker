import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(v: any): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const appId = Number(id);

  if (!Number.isFinite(appId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const status = body.status;
  const order = body.order;
  const aiSummary = body.aiSummary;

  if (status !== undefined && !isStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (order !== undefined && !(Number.isInteger(order) && order >= 0)) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  if (aiSummary !== undefined && !(typeof aiSummary === "string" || aiSummary === null)) {
    return NextResponse.json({ error: "Invalid aiSummary" }, { status: 400 });
  }

  const updated = await prisma.application.update({
    where: { id: appId },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(aiSummary !== undefined ? { aiSummary } : {}),
    },
  });

  return NextResponse.json(updated);
}
