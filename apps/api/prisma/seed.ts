import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional)
  await prisma.user.deleteMany();

  const users = [
    { name: "Alice Johnson", email: "alice@example.com" },
    { name: "Bob Williams", email: "bob@example.com" },
    { name: "Charlie Brown", email: "charlie@example.com" },
    { name: "Diana Prince", email: "diana@example.com" },
    { name: "Ethan Davis", email: "ethan@example.com" },
    { name: "Fiona Carter", email: "fiona@example.com" },
    { name: "George Miller", email: "george@example.com" },
    { name: "Hannah Wilson", email: "hannah@example.com" },
    { name: "Ivan Peterson", email: "ivan@example.com" },
    { name: "Julia Roberts", email: "julia@example.com" },
  ];

  await prisma.user.createMany({
    data: users,
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
