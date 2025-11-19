import { prisma } from "../src/config/prisma";

console.log("Seeding...");

async function main() {
  // Option A: wipe the table (dev only; be careful!)
  // await prisma.user.deleteMany({});

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
    skipDuplicates: true, // ignore duplicates if run multiple times
  });

  console.log("Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
