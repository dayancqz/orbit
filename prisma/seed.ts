// Loads the same "Sarah's Korea Trip" scenario from src/lib/mockData.ts
// into the real database, once the backend track has run
// `npm run prisma:migrate`. Run with `npm run seed`.

import { PrismaClient } from "@prisma/client";
import { sarahLifeGraph } from "../src/lib/mockData";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      name: sarahLifeGraph.name,
      email: "sarah@example.com",
    },
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
