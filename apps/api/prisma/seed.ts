import { prisma } from "../src/config/prisma";

console.log("Seeding...");

async function main() {
  console.log("🌱 Seeding database...");

  // ----------------------------------------------------
  // USERS
  // ----------------------------------------------------
  const superAdmin = await prisma.user.create({
    data: {
      id: "5fa1b20b-1111-4a1a-b111-000000000001",
      name: "Owner Laundry",
      email: "owner@laundry.com",
      role: "super_admin",
      password: "$2b$10$abcdefghijklmnopqrstuv", // fake hashed password
      verified: true,
    },
  });

  const outletAdmin1 = await prisma.user.create({
    data: {
      id: "5fa1b20b-1111-4a1a-b111-000000000002",
      name: "Admin Outlet A",
      email: "outletA@laundry.com",
      role: "outlet_admin",
      verified: true,
    },
  });

  const outletAdmin2 = await prisma.user.create({
    data: {
      id: "5fa1b20b-1111-4a1a-b111-000000000003",
      name: "Admin Outlet B",
      email: "outletB@laundry.com",
      role: "outlet_admin",
      verified: true,
    },
  });

  // ----------------------------------------------------
  // OUTLETS
  // ----------------------------------------------------
  const outletA = await prisma.outlet.create({
    data: {
      id: "9001a20b-aaaa-4a1a-a111-000000000001",
      name: "Outlet Laundry A",
      address: "Jl. Mawar No. 1",
      lat: -6.2001,
      lng: 106.8167,
      max_distance_km: 15,
      price_per_km: 2000,
      price_per_kg: 8000,
    },
  });

  const outletB = await prisma.outlet.create({
    data: {
      id: "9001a20b-aaaa-4a1a-a111-000000000002",
      name: "Outlet Laundry B",
      address: "Jl. Melati No. 5",
      lat: -6.1801,
      lng: 106.8207,
      max_distance_km: 12,
      price_per_km: 2500,
      price_per_kg: 9000,
    },
  });

  // Assign outlet admins
  await prisma.user.update({
    where: { id: outletAdmin1.id },
    data: { outlet_id: outletA.id },
  });

  await prisma.user.update({
    where: { id: outletAdmin2.id },
    data: { outlet_id: outletB.id },
  });

  // ----------------------------------------------------
  // WORKERS
  // ----------------------------------------------------
  const workers = await prisma.user.createMany({
    data: [
      {
        id: "1111b20b-1111-4a1a-b111-000000000004",
        name: "W Worker A",
        email: "washA@laundry.com",
        role: "worker",
        worker_station: "washing",
        outlet_id: outletA.id,
        verified: true,
      },
      {
        id: "1111b20b-1111-4a1a-b111-000000000005",
        name: "I Worker A",
        email: "ironA@laundry.com",
        role: "worker",
        worker_station: "ironing",
        outlet_id: outletA.id,
        verified: true,
      },
      {
        id: "1111b20b-1111-4a1a-b111-000000000006",
        name: "P Worker A",
        email: "packA@laundry.com",
        role: "worker",
        worker_station: "packing",
        outlet_id: outletA.id,
        verified: true,
      },
      {
        id: "2111b20b-1111-4a1a-b111-000000000004",
        name: "W Worker B",
        email: "washB@laundry.com",
        role: "worker",
        worker_station: "washing",
        outlet_id: outletB.id,
        verified: true,
      },
      {
        id: "2111b20b-1111-4a1a-b111-000000000005",
        name: "I Worker B",
        email: "ironB@laundry.com",
        role: "worker",
        worker_station: "ironing",
        outlet_id: outletB.id,
        verified: true,
      },
      {
        id: "2111b20b-1111-4a1a-b111-000000000006",
        name: "P Worker B",
        email: "packB@laundry.com",
        role: "worker",
        worker_station: "packing",
        outlet_id: outletB.id,
        verified: true,
      },
    ],
  });

  // ----------------------------------------------------
  // DRIVERS
  // ----------------------------------------------------
  await prisma.user.createMany({
    data: [
      {
        id: "3333b20b-2222-4a1a-b111-000000000001",
        name: "Driver A1",
        email: "driverA1@laundry.com",
        role: "driver",
        outlet_id: outletA.id,
        verified: true,
      },
      {
        id: "3333b20b-2222-4a1a-b111-000000000002",
        name: "Driver A2",
        email: "driverA2@laundry.com",
        role: "driver",
        outlet_id: outletA.id,
        verified: true,
      },
      {
        id: "3333b20b-2222-4a1a-b111-000000000003",
        name: "Driver B1",
        email: "driverB1@laundry.com",
        role: "driver",
        outlet_id: outletB.id,
        verified: true,
      },
      {
        id: "3333b20b-2222-4a1a-b111-000000000004",
        name: "Driver B2",
        email: "driverB2@laundry.com",
        role: "driver",
        outlet_id: outletB.id,
        verified: true,
      },
    ],
  });

  // ----------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------
  const cust1 = await prisma.user.create({
    data: {
      id: "4444b20b-1111-4a1a-b111-000000000001",
      name: "Budi",
      email: "budi@mail.com",
      role: "customer",
      verified: true,
    },
  });

  const cust2 = await prisma.user.create({
    data: {
      id: "4444b20b-1111-4a1a-b111-000000000002",
      name: "Sari",
      email: "sari@mail.com",
      role: "customer",
      verified: true,
    },
  });

  // ----------------------------------------------------
  // USER ADDRESSES
  // ----------------------------------------------------
  await prisma.userAddress.createMany({
    data: [
      {
        id: "addr001",
        user_id: cust1.id,
        label: "Rumah",
        address: "Jl. Kenanga No. 12",
        lat: -6.201,
        lng: 106.817,
        is_default: true,
      },
      {
        id: "addr002",
        user_id: cust2.id,
        label: "Rumah",
        address: "Jl. Flamboyan No. 8",
        lat: -6.202,
        lng: 106.818,
        is_default: true,
      },
    ],
  });

  // ----------------------------------------------------
  // ITEMS (master)
  // ----------------------------------------------------
  await prisma.item.createMany({
    data: [
      { id: "item01", name: "Kaos" },
      { id: "item02", name: "Celana" },
      { id: "item03", name: "Jaket" },
      { id: "item04", name: "Handuk" },
      { id: "item05", name: "Sprei" },
      { id: "item06", name: "Celana Dalam" },
    ],
  });

  // ----------------------------------------------------
  // SAMPLE ORDER
  // ----------------------------------------------------
  const order1 = await prisma.order.create({
    data: {
      id: "ord001",
      customer_id: cust1.id,
      outlet_id: outletA.id,
      pickup_fee: 8000,
      delivery_fee: 8000,
      laundry_price: 24000,
      total_amount: 40000,
      total_kilo: 3.0,
      status: "Laundry_Sedang_Dicuci",
      paid: false,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        id: "oi001",
        order_id: order1.id,
        item_id: "item01",
        quantity_initial: 2,
      },
      {
        id: "oi002",
        order_id: order1.id,
        item_id: "item06",
        quantity_initial: 5,
      },
    ],
  });

  // ----------------------------------------------------
  // SAMPLE SHIFT
  // ----------------------------------------------------
  await prisma.workerShift.createMany({
    data: [
      {
        id: "shiftA1",
        worker_id: "1111b20b-1111-4a1a-b111-000000000004",
        outlet_id: outletA.id,
        station: "washing",
        day_of_week: "mon",
        start_time: new Date("2023-01-01T08:00:00Z"),
        end_time: new Date("2023-01-01T16:00:00Z"),
      },
    ],
  });

  // ----------------------------------------------------
  // PAYMENT PROOF (manual)
  // ----------------------------------------------------
  await prisma.paymentProof.create({
    data: {
      id: "payproof01",
      order_id: order1.id,
      image_url: "https://fake-storage.com/payments/proof.png",
    },
  });

  // ----------------------------------------------------
  // PAYMENT GATEWAY (optional)
  // ----------------------------------------------------
  await prisma.paymentTransaction.create({
    data: {
      id: "pg001",
      order_id: order1.id,
      amount: 40000,
      status: "pending",
      raw_response: { example: "waiting for callback" },
    },
  });

  // ----------------------------------------------------
  // COMPLAINT EXAMPLE
  // ----------------------------------------------------
  await prisma.complaint.create({
    data: {
      id: "cmp001",
      order_id: order1.id,
      user_id: cust1.id,
      message: "Kaos saya hilang 1.",
    },
  });

  console.log("🌱 Seed completed!");
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
