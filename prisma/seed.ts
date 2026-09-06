// Loads the same "Sarah's Korea Trip" scenario from src/lib/mockData.ts
// into the real database, once the backend track has run
// `npm run prisma:migrate`. Run with `npm run seed`.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sarahLifeGraph } from "../src/lib/mockData";

const prisma = new PrismaClient();

// Demo login: sarah@example.com / password123
const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      name: sarahLifeGraph.name,
      email: "sarah@example.com",
      passwordHash,
    },
  });

  await prisma.guardrailSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  for (const account of sarahLifeGraph.accounts) {
    await prisma.account.create({
      data: {
        userId: user.id,
        name: account.name,
        type: "savings",
        balance: account.balance,
        interestRate: account.interestRate,
        currency: account.currency,
      },
    });
  }

  for (const event of sarahLifeGraph.calendarEvents) {
    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: event.title,
        location: event.location,
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
        inferredEventType: "trip",
      },
    });
  }

  for (const sub of sarahLifeGraph.subscriptions) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        merchant: sub.merchant,
        monthlyAmount: sub.monthlyAmount,
        lastUsedAt: sub.lastUsedAt ? new Date(sub.lastUsedAt) : null,
        usageScore: sub.usageScore,
        status: sub.status,
      },
    });
  }

  const existingGroup = await prisma.splitGroup.findFirst({ where: { createdById: user.id, name: "Seoul Trip Friends" } });
  if (!existingGroup) {
    const group = await prisma.splitGroup.create({
      data: {
        name: "Seoul Trip Friends",
        createdById: user.id,
        members: {
          create: [
            { userId: user.id, name: user.name },
            { name: "Ben" }, // non-Orbit friend, tracked by name only
            { name: "Mei" }, // non-Orbit friend, tracked by name only
          ],
        },
      },
      include: { members: true },
    });
    const sarahMember = group.members.find((m) => m.userId === user.id)!;
    const benMember = group.members.find((m) => m.name === "Ben")!;
    const meiMember = group.members.find((m) => m.name === "Mei")!;

    await prisma.splitExpense.create({
      data: {
        groupId: group.id,
        description: "Dinner at Myeongdong",
        amount: 90,
        paidById: sarahMember.id,
        splitType: "equal",
        occurredAt: new Date(Date.now() - 6 * 86_400_000),
        shares: {
          create: [
            { memberId: sarahMember.id, amount: 30 },
            { memberId: benMember.id, amount: 30 },
            { memberId: meiMember.id, amount: 30 },
          ],
        },
      },
    });

    await prisma.splitExpense.create({
      data: {
        groupId: group.id,
        description: "Taxi to airport",
        amount: 45,
        paidById: benMember.id,
        splitType: "equal",
        occurredAt: new Date(Date.now() - 5 * 86_400_000),
        shares: {
          create: [
            { memberId: sarahMember.id, amount: 15 },
            { memberId: benMember.id, amount: 15 },
            { memberId: meiMember.id, amount: 15 },
          ],
        },
      },
    });

    // Mei has already paid Sarah back for part of what she owes — leaves a
    // partial, still-outstanding balance so the demo shows both a settled
    // and an unsettled debt in the same group.
    await prisma.splitSettlement.create({
      data: {
        groupId: group.id,
        fromMemberId: meiMember.id,
        toMemberId: sarahMember.id,
        amount: 30,
        method: "manual",
      },
    });
  }

  console.log(`Seeded Customer Life Graph for ${user.name} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
