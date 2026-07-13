import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "adminA@gmail.com" } });
  console.log("adminA result:", user ? { id: user.id, email: user.email, role: user.role } : "NULL");
  
  const superadmin = await prisma.user.findUnique({ where: { email: "tijipog769@roastic.com" } });
  console.log("superadmin result:", superadmin ? { id: superadmin.id, email: superadmin.email, role: superadmin.role } : "NULL");

  // Check what DB we're actually connected to
  const result = await prisma.$queryRaw`SELECT current_database()`;
  console.log("Connected to DB:", result);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
