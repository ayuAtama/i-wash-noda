#!/usr/bin/env node
// scripts/setup-test-users.ts
// Creates all test users with passwords and proper roles
// Usage: npx tsx scripts/setup-test-users.ts

import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const bcrypt = await import("bcrypt");
  const password = await bcrypt.default.hash("TestPassword123", 10);

  const users = [
    {
      email: "adminA@gmail.com",
      name: "Admin Outlet A",
      role: "outlet_admin" as Role,
    },
    { email: "washA@gmail.com", name: "Wash Worker A", role: "worker" as Role },
    { email: "ironA@gmail.com", name: "Iron Worker A", role: "worker" as Role },
    { email: "packA@gmail.com", name: "Pack Worker A", role: "worker" as Role },
    { email: "driverA1@gmail.com", name: "Driver A1", role: "driver" as Role },
    { email: "budi@gmail.com", name: "Budi Test", role: "customer" as Role },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password,
        emailVerified: true,
        name: u.name,
        role: u.role,
      },
      create: {
        email: u.email,
        name: u.name,
        password,
        emailVerified: true,
        role: u.role,
      },
    });
    console.log(`✓ ${u.email} → ${user.id} (${user.role})`);
  }

  // Assign outlet + station for workers
  const outlets = await prisma.outlet.findMany({ take: 1 });
  const outletId = outlets[0]?.id;
  if (!outletId) {
    console.error("No outlets found!");
    process.exit(1);
  }

  const workerAssignments = [
    { email: "adminA@gmail.com", worker_station: null },
    { email: "washA@gmail.com", worker_station: "washing" },
    { email: "ironA@gmail.com", worker_station: "ironing" },
    { email: "packA@gmail.com", worker_station: "packing" },
    { email: "driverA1@gmail.com", worker_station: null },
  ];

  for (const w of workerAssignments) {
    await prisma.user.update({
      where: { email: w.email },
      data: {
        outlet_id: outletId,
        worker_station: w.worker_station as any,
      },
    });
    console.log(
      `  → ${w.email} assigned to outlet ${outletId.slice(0, 8)}... station=${w.worker_station ?? "null"}`,
    );
  }

  console.log("\nDone! All test users created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
