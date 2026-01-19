import { prisma } from "../lib/prisma";

const STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;

async function main() {
  for (const status of STATUSES) {
    const apps = await prisma.application.findMany({
      where: { status },
      orderBy: [{ createdAt: "asc" }],
      select: { id: true },
    });

    for (let i = 0; i < apps.length; i++) {
      await prisma.application.update({
        where: { id: apps[i].id },
        data: { order: i },
      });
    }
  }

  console.log("✅ Backfill complete");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
