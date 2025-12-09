import { prisma } from "../src/config/prisma";

console.log("Seeding...");

async function main() {
  console.log("🌱 Seeding database...");

  // ----------------------------------------------------
  // SUPER ADMIN
  // ----------------------------------------------------
  const superAdmin = await prisma.user.create({
    data: {
      name: "Owner Laundry",
      email: "owner@laundry.com",
      role: "super_admin",
      password: "$2b$10$abcdefghijklmnopqrstuv", // fake hashed
      emailVerified: true,
    },
  });

  // ----------------------------------------------------
  // OUTLET ADMINS
  // ----------------------------------------------------
  const outletAdminA = await prisma.user.create({
    data: {
      name: "Admin Outlet A",
      email: "outletA@laundry.com",
      role: "outlet_admin",
      emailVerified: true,
    },
  });

  const outletAdminB = await prisma.user.create({
    data: {
      name: "Admin Outlet B",
      email: "outletB@laundry.com",
      role: "outlet_admin",
      emailVerified: true,
    },
  });

  // ----------------------------------------------------
  // OUTLETS
  // ----------------------------------------------------
  const outletA = await prisma.outlet.create({
    data: {
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
      name: "Outlet Laundry B",
      address: "Jl. Melati No. 5",
      lat: -6.1801,
      lng: 106.8207,
      max_distance_km: 12,
      price_per_km: 2500,
      price_per_kg: 9000,
    },
  });

  // update outlet admin
  await prisma.user.update({
    where: { id: outletAdminA.id },
    data: { outlet_id: outletA.id },
  });

  await prisma.user.update({
    where: { id: outletAdminB.id },
    data: { outlet_id: outletB.id },
  });

  // ----------------------------------------------------
  // WORKERS FOR OUTLET A
  // ----------------------------------------------------
  const workerA_Wash = await prisma.user.create({
    data: {
      name: "Worker A - Washing",
      email: "washA@laundry.com",
      role: "worker",
      worker_station: "washing",
      outlet_id: outletA.id,
      emailVerified: true,
    },
  });

  const workerA_Iron = await prisma.user.create({
    data: {
      name: "Worker A - Ironing",
      email: "ironA@laundry.com",
      role: "worker",
      worker_station: "ironing",
      outlet_id: outletA.id,
      emailVerified: true,
    },
  });

  const workerA_Pack = await prisma.user.create({
    data: {
      name: "Worker A - Packing",
      email: "packA@laundry.com",
      role: "worker",
      worker_station: "packing",
      outlet_id: outletA.id,
      emailVerified: true,
    },
  });

  // ----------------------------------------------------
  // WORKERS FOR OUTLET B
  // ----------------------------------------------------
  const workerB_Wash = await prisma.user.create({
    data: {
      name: "Worker B - Washing",
      email: "washB@laundry.com",
      role: "worker",
      worker_station: "washing",
      outlet_id: outletB.id,
      emailVerified: true,
    },
  });

  const workerB_Iron = await prisma.user.create({
    data: {
      name: "Worker B - Ironing",
      email: "ironB@laundry.com",
      role: "worker",
      worker_station: "ironing",
      outlet_id: outletB.id,
      emailVerified: true,
    },
  });

  const workerB_Pack = await prisma.user.create({
    data: {
      name: "Worker B - Packing",
      email: "packB@laundry.com",
      role: "worker",
      worker_station: "packing",
      outlet_id: outletB.id,
      emailVerified: true,
    },
  });

  // ----------------------------------------------------
  // DRIVERS
  // ----------------------------------------------------
  const driverA1 = await prisma.user.create({
    data: {
      name: "Driver A1",
      email: "driverA1@laundry.com",
      role: "driver",
      outlet_id: outletA.id,
      emailVerified: true,
    },
  });

  const driverA2 = await prisma.user.create({
    data: {
      name: "Driver A2",
      email: "driverA2@laundry.com",
      role: "driver",
      outlet_id: outletA.id,
      emailVerified: true,
    },
  });

  const driverB1 = await prisma.user.create({
    data: {
      name: "Driver B1",
      email: "driverB1@laundry.com",
      role: "driver",
      outlet_id: outletB.id,
      emailVerified: true,
    },
  });

  const driverB2 = await prisma.user.create({
    data: {
      name: "Driver B2",
      email: "driverB2@laundry.com",
      role: "driver",
      outlet_id: outletB.id,
      emailVerified: true,
    },
  });

  // ----------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------
  const cust1 = await prisma.user.create({
    data: {
      name: "Budi",
      email: "budi@mail.com",
      role: "customer",
      emailVerified: true,
    },
  });

  const cust2 = await prisma.user.create({
    data: {
      name: "Sari",
      email: "sari@mail.com",
      role: "customer",
      emailVerified: true,
    },
  });

  // ----------------------------------------------------
  // ADDRESSES
  // ----------------------------------------------------
  await prisma.userAddress.create({
    data: {
      user_id: cust1.id,
      label: "Rumah",
      address: "Jl. Kenanga No.12",
      lat: -6.2011,
      lng: 106.817,
      is_default: true,
    },
  });

  await prisma.userAddress.create({
    data: {
      user_id: cust2.id,
      label: "Rumah",
      address: "Jl. Flamboyan No.8",
      lat: -6.2021,
      lng: 106.8183,
      is_default: true,
    },
  });

  // ----------------------------------------------------
  // ITEMS
  // ----------------------------------------------------
  const kaos = await prisma.item.create({ data: { name: "Kaos" } });
  const celana = await prisma.item.create({ data: { name: "Celana" } });
  const handuk = await prisma.item.create({ data: { name: "Handuk" } });

  // ----------------------------------------------------
  // ORDER 1 (Outlet A)
  // ----------------------------------------------------
  const order1 = await prisma.order.create({
    data: {
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
        order_id: order1.id,
        item_id: kaos.id,
        quantity_initial: 2,
      },
      {
        order_id: order1.id,
        item_id: celana.id,
        quantity_initial: 3,
      },
    ],
  });

  // ----------------------------------------------------
  // SHIFT EXAMPLE
  // ----------------------------------------------------
  await prisma.workerShift.create({
    data: {
      worker_id: workerA_Wash.id,
      outlet_id: outletA.id,
      station: "washing",
      day_of_week: "mon",
      start_time: new Date("2024-01-01T08:00:00Z"),
      end_time: new Date("2024-01-01T16:00:00Z"),
    },
  });

  // ----------------------------------------------------
  // PAYMENT PROOF
  // ----------------------------------------------------
  await prisma.paymentProof.create({
    data: {
      order_id: order1.id,
      image_url: "https://example.com/payment-proof.jpg",
    },
  });

  // ----------------------------------------------------
  // PAYMENT GATEWAY TRANSACTION
  // ----------------------------------------------------
  await prisma.paymentTransaction.create({
    data: {
      order_id: order1.id,
      amount: 40000,
      status: "pending",
      raw_response: { info: "waiting payment" },
    },
  });

  // ----------------------------------------------------
  // COMPLAINT EXAMPLE
  // ----------------------------------------------------
  await prisma.complaint.create({
    data: {
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
