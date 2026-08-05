#!/usr/bin/env node
// scripts/db-set-password.ts
// Directly sets a user's password and marks email as verified
// Usage: npx tsx scripts/db-set-password.ts <email> <password>

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/db-set-password.ts <email> <password>",
    );
    process.exit(1);
  }

  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.default.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: {
      password: hashedPassword,
      emailVerified: true,
    },
    create: {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      emailVerified: true,
      role: "customer",
    },
  });

  console.log(
    JSON.stringify({ id: user.id, email: user.email, role: user.role }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
