import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const rows = await prisma.test.findMany({ orderBy: { id: "desc" } });
  return Response.json(rows);
}

export async function POST() {
  const record = await prisma.test.create({
    data: { name: "First portfolio record" },
  });
  return Response.json(record);
}
