// scripts/bootstrap.ts
// Run once: npx tsx scripts/bootstrap.ts
// Sets a known password for owner@laundry.com so we can login as super_admin.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const EMAIL = "tijipog769@roastic.com";
const PASSWORD = "TestPassword123";

async function main() {
  console.log("Bootstrapping super_admin user...");

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.update({
    where: { email: EMAIL },
    data: {
      password: hashedPassword,
      emailVerified: true,
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`✓ Updated ${user.email} (${user.role}) — id: ${user.id}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log("  You can now login with POST /api/login");
}

main()
  .catch((e) => {
    console.error("Bootstrap failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
