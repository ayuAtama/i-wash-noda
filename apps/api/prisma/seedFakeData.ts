import { prisma } from "../src/config/prisma";
import bcrypt from "bcrypt";

export class Seed {
  static PASSWORD = "password123";
  static BCRYPT_ROUNDS = 10;

  // ─────────────────────────────────────────────────
  // FIXED UUIDs (realistic format for Zod validation)
  // ─────────────────────────────────────────────────
  static OUTLET_D_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

  static ADMIN_D_ID = "b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e";
  static WASH_D_ID = "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f";
  static IRON_D_ID = "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a";
  static PACK_D_ID = "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b";
  static CUST_D_ID = "f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c";
  static WALKIN_D_ID = "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d";
  static WALKIN_ADDR_ID = "b3c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e";

  // Items
  static ITEM_KAOS_ID = "1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d";
  static ITEM_CELANA_ID = "2b3c4d5e-6f7a-4b8c-9d0e-2f3a4b5c6d7e";
  static ITEM_HANDUK_ID = "3c4d5e6f-7a8b-4c9d-8e1f-3a4b5c6d7e8f";
  static ITEM_SELIMUT_ID = "4d5e6f7a-8b9c-4d0e-9f2a-4b5c6d7e8f9a";
  static ITEM_KEMEJA_ID = "5e6f7a8b-9c0d-4e1f-8a3b-5c6d7e8f9a0b";

  // Orders
  static ORDER_D1_ID = "6f7a8b9c-0d1e-4f2a-8b4c-6d7e8f9a0b1c";
  static ORDER_D2_ID = "7a8b9c0d-1e2f-4a3b-8c5d-7e8f9a0b1c2d";
  static ORDER_D3_ID = "8b9c0d1e-2f3a-4b4c-9d6e-8f9a0b1c2d3e";
  static ORDER_D4_ID = "9c0d1e2f-3a4b-4c5d-ae7f-9a0b1c2d3e4f";
  static ORDER_D5_ID = "0d1e2f3a-4b5c-4d6e-bf8a-0b1c2d3e4f5a";
  static ORDER_D6_ID = "1e2f3a4b-5c6d-4e7f-8a9b-1c2d3e4f5a6b";
  static ORDER_D7_ID = "2f3a4b5c-6d7e-4f8a-9b0c-2d3e4f5a6b7c";
  static ORDER_D8_ID = "3a4b5c6d-7e8f-4a9b-8c1d-3e4f5a6b7c8d";

  static async main() {
    console.log("🏗️  Seeding fake data for adminMismatch & workerStation...");

    const hashedPassword = await bcrypt.hash(Seed.PASSWORD, Seed.BCRYPT_ROUNDS);

    // ═══════════════════════════════════════════════════
    // CLEANUP: delete old Outlet D data (raw SQL cascade)
    // ═══════════════════════════════════════════════════
    console.log("🧹 Cleaning up old Outlet D data...");

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM order_station_logs
    WHERE worker_id IN (
      SELECT id FROM users WHERE outlet_id::text = $1
    ) OR approved_by IN (
      SELECT id FROM users WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM station_summary
    WHERE order_id IN (
      SELECT id FROM orders WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM order_items
    WHERE order_id IN (
      SELECT id FROM orders WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM complaints
    WHERE order_id IN (
      SELECT id FROM orders WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM payment_proof
    WHERE order_id IN (
      SELECT id FROM orders WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM payment_transactions
    WHERE order_id IN (
      SELECT id FROM orders WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM pickup_requests
    WHERE order_id IN (
      SELECT id FROM orders WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM delivery_requests
    WHERE order_id IN (
      SELECT id FROM orders WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM orders WHERE outlet_id::text = $1
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM worker_shifts
    WHERE worker_id IN (
      SELECT id FROM users WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM user_addresses
    WHERE user_id IN (
      SELECT id FROM users WHERE outlet_id::text = $1
    )
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM walk_in_customers WHERE outlet_id::text = $1
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM users WHERE outlet_id::text = $1
  `,
      Seed.OUTLET_D_ID,
    );

    await prisma.$executeRawUnsafe(
      `
    DELETE FROM outlets WHERE id::text = $1
  `,
      Seed.OUTLET_D_ID,
    );

    console.log("  ✅ Cleanup done");

    // ═══════════════════════════════════════════════════
    // OUTLET D
    // ═══════════════════════════════════════════════════
    const outletD = await prisma.outlet.upsert({
      where: { id: Seed.OUTLET_D_ID },
      update: {},
      create: {
        id: Seed.OUTLET_D_ID,
        name: "Outlet Laundry D (Fake Data Testing)",
        address: "Jl. Testing Fake No. 42",
        lat: -6.22,
        lng: 106.84,
        max_distance_km: 25,
        price_per_km: 2000,
        price_per_kg: 7500,
      },
    });
    console.log(`  ✅ Outlet D: ${outletD.id}`);

    // ═══════════════════════════════════════════════════
    // OUTLET ADMIN D
    // ═══════════════════════════════════════════════════
    const adminD = await prisma.user.upsert({
      where: { email: "admind@laundry.com" },
      update: {},
      create: {
        id: Seed.ADMIN_D_ID,
        name: "Admin Outlet D",
        email: "admind@laundry.com",
        role: "outlet_admin",
        outlet_id: outletD.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });
    console.log(`  ✅ Admin D: ${adminD.id}`);

    // ═══════════════════════════════════════════════════
    // WORKERS OUTLET D
    // ═══════════════════════════════════════════════════
    const workerD_Wash = await prisma.user.upsert({
      where: { email: "washd@laundry.com" },
      update: {},
      create: {
        id: Seed.WASH_D_ID,
        name: "Worker D - Washing",
        email: "washd@laundry.com",
        role: "worker",
        worker_station: "washing",
        outlet_id: outletD.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const workerD_Iron = await prisma.user.upsert({
      where: { email: "irond@laundry.com" },
      update: {},
      create: {
        id: Seed.IRON_D_ID,
        name: "Worker D - Ironing",
        email: "irond@laundry.com",
        role: "worker",
        worker_station: "ironing",
        outlet_id: outletD.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const workerD_Pack = await prisma.user.upsert({
      where: { email: "packd@laundry.com" },
      update: {},
      create: {
        id: Seed.PACK_D_ID,
        name: "Worker D - Packing",
        email: "packd@laundry.com",
        role: "worker",
        worker_station: "packing",
        outlet_id: outletD.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });
    console.log(
      `  ✅ Workers: washD=${workerD_Wash.id}, ironD=${workerD_Iron.id}, packD=${workerD_Pack.id}`,
    );

    // ═══════════════════════════════════════════════════
    // CUSTOMER (customer app)
    // ═══════════════════════════════════════════════════
    const customerD = await prisma.user.upsert({
      where: { email: "budid@mail.com" },
      update: {},
      create: {
        id: Seed.CUST_D_ID,
        name: "Budi Darmawan",
        email: "budid@mail.com",
        role: "customer",
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const addressD = await prisma.userAddress.upsert({
      where: { id: Seed.WALKIN_ADDR_ID },
      update: {},
      create: {
        id: Seed.WALKIN_ADDR_ID,
        user_id: customerD.id,
        label: "Kantor D",
        address: "Jl. Sudirman No. 100",
        lat: -6.215,
        lng: 106.835,
        is_default: true,
      },
    });
    console.log(`  ✅ Customer D: ${customerD.id}`);

    // ═══════════════════════════════════════════════════
    // WALK-IN CUSTOMER
    // ═══════════════════════════════════════════════════
    const walkInD = await prisma.walkInCustomer.upsert({
      where: { phone: "089876543210" },
      update: {},
      create: {
        id: Seed.WALKIN_D_ID,
        name: "Toko Lancar Jaya",
        phone: "089876543210",
        created_by: adminD.id,
        outlet_id: outletD.id,
      },
    });
    console.log(`  ✅ Walk-in Customer D: ${walkInD.id}`);

    // ═══════════════════════════════════════════════════
    // ITEMS (find or create)
    // ═══════════════════════════════════════════════════
    const allItemNames = ["Kaos", "Celana", "Handuk", "Selimut", "Kemeja"];
    const items: Record<string, { id: string; name: string }> = {};

    for (const name of allItemNames) {
      let item = await prisma.item.findFirst({ where: { name } });
      if (!item) {
        item = await prisma.item.create({ data: { name } });
      }
      items[name] = item;
    }

    const kaos = items["Kaos"];
    const celana = items["Celana"];
    const handuk = items["Handuk"];
    const selimut = items["Selimut"];
    const kemeja = items["Kemeja"];
    console.log("  ✅ All items ready (5 items)");

    // ═══════════════════════════════════════════════════
    // WORKER SHIFTS — ALL 7 DAYS (24/7 testing)
    // ═══════════════════════════════════════════════════
    const allDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
    const workers = [
      { worker_id: workerD_Wash.id, station: "washing" as const },
      { worker_id: workerD_Iron.id, station: "ironing" as const },
      { worker_id: workerD_Pack.id, station: "packing" as const },
    ];

    for (const w of workers) {
      for (const day of allDays) {
        const existing = await prisma.workerShift.findFirst({
          where: {
            worker_id: w.worker_id,
            outlet_id: outletD.id,
            day_of_week: day,
          },
        });
        if (!existing) {
          await prisma.workerShift.create({
            data: {
              worker_id: w.worker_id,
              outlet_id: outletD.id,
              station: w.station,
              day_of_week: day,
              start_time: new Date("2024-01-01T00:00:00Z"),
              end_time: new Date("2024-01-01T23:59:59Z"),
            },
          });
        }
      }
    }
    console.log("  ✅ Worker shifts created (all 7 days, 24h)");

    // ═══════════════════════════════════════════════════
    // HELPER: create order items only if none exist
    // ═══════════════════════════════════════════════════
    async function ensureOrderItems(
      orderId: string,
      data: { item_id: string; quantity_initial: number }[],
    ) {
      const existing = await prisma.orderItem.findMany({
        where: { order_id: orderId },
      });
      if (existing.length === 0) {
        await prisma.orderItem.createMany({
          data: data.map((d) => ({ ...d, order_id: orderId })),
        });
      }
      return await prisma.orderItem.findMany({ where: { order_id: orderId } });
    }

    // ═══════════════════════════════════════════════════
    // ORDERS
    // ═══════════════════════════════════════════════════

    // ─────────────────────────────────────────────────
    // ORDER D1: washing_in_progress, NO worker assigned
    // Test: workerStation GET /available (washing)
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D1_ID },
      update: {},
      create: {
        id: Seed.ORDER_D1_ID,
        customer_id: customerD.id,
        outlet_id: outletD.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 21000,
        total_amount: 31000,
        total_kilo: 3.5,
        status: "washing_in_progress",
        paid: false,
      },
    });

    await ensureOrderItems(Seed.ORDER_D1_ID, [
      { item_id: kaos.id, quantity_initial: 4 },
      { item_id: celana.id, quantity_initial: 2 },
      { item_id: handuk.id, quantity_initial: 1 },
    ]);
    console.log(
      "  ✅ Order D1: washing available (no worker) → GET /available",
    );

    // ─────────────────────────────────────────────────
    // ORDER D2: washing_in_progress, worker assigned, NO reinput
    // Test: workerStation GET /active (washing) + POST /reinput
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D2_ID },
      update: {},
      create: {
        id: Seed.ORDER_D2_ID,
        walkin_customer_id: walkInD.id,
        outlet_id: outletD.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 15000,
        total_amount: 15000,
        total_kilo: 2.0,
        status: "washing_in_progress",
        washing_worker_id: workerD_Wash.id,
        paid: false,
      },
    });

    await ensureOrderItems(Seed.ORDER_D2_ID, [
      { item_id: kaos.id, quantity_initial: 3 },
      { item_id: kemeja.id, quantity_initial: 1 },
    ]);
    console.log(
      "  ✅ Order D2: washing active (worker assigned, no reinput) → GET /active",
    );

    // ─────────────────────────────────────────────────
    // ORDER D3: washing_in_progress, reinput DONE (all MATCH)
    // Test: workerStation POST /reinput + POST /complete (should succeed)
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D3_ID },
      update: {},
      create: {
        id: Seed.ORDER_D3_ID,
        customer_id: customerD.id,
        outlet_id: outletD.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 30000,
        total_amount: 40000,
        total_kilo: 4.0,
        status: "washing_in_progress",
        washing_worker_id: workerD_Wash.id,
        paid: false,
      },
    });

    const orderD3Items = await ensureOrderItems(Seed.ORDER_D3_ID, [
      { item_id: kaos.id, quantity_initial: 5 },
      { item_id: celana.id, quantity_initial: 3 },
    ]);

    // StationLogs + StationSummary (all match / approved)
    const existingD3Logs = await prisma.orderStationLog.findMany({
      where: { order_id: Seed.ORDER_D3_ID },
    });
    if (existingD3Logs.length === 0) {
      for (const oi of orderD3Items) {
        await prisma.orderStationLog.create({
          data: {
            order_id: Seed.ORDER_D3_ID,
            item_id: oi.item_id,
            station: "washing",
            worker_id: workerD_Wash.id,
            quantity_input: oi.quantity_initial,
            status: "approved",
            approved_by: workerD_Wash.id,
            approved_at: new Date(),
          },
        });
        await prisma.stationSummary.create({
          data: {
            order_id: Seed.ORDER_D3_ID,
            item_id: oi.item_id,
            station: "washing",
            latest_quantity: oi.quantity_initial,
          },
        });
      }
    }
    console.log(
      "  ✅ Order D3: washing reinput match → POST /reinput + POST /complete",
    );

    // ─────────────────────────────────────────────────
    // ORDER D4: washing_in_progress, reinput MISMATCH (Celana wrong qty)
    // Test: adminMismatch GET / (list), GET /:orderId/:stationName (detail),
    //       PUT /:orderId/:stationName (resolve)
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D4_ID },
      update: {},
      create: {
        id: Seed.ORDER_D4_ID,
        walkin_customer_id: walkInD.id,
        outlet_id: outletD.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 20000,
        total_amount: 20000,
        total_kilo: 2.5,
        status: "washing_in_progress",
        washing_worker_id: workerD_Wash.id,
        paid: false,
      },
    });

    const orderD4Items = await ensureOrderItems(Seed.ORDER_D4_ID, [
      { item_id: kaos.id, quantity_initial: 4 },
      { item_id: celana.id, quantity_initial: 3 },
    ]);

    // Create pending StationLogs (mismatch: Celana initial=3 but worker re-input=5)
    const existingD4Logs = await prisma.orderStationLog.findMany({
      where: { order_id: Seed.ORDER_D4_ID },
    });
    if (existingD4Logs.length === 0) {
      for (const oi of orderD4Items) {
        const isCelana = oi.item_id === celana.id;

        await prisma.orderStationLog.create({
          data: {
            order_id: Seed.ORDER_D4_ID,
            item_id: oi.item_id,
            station: "washing",
            worker_id: workerD_Wash.id,
            quantity_input: isCelana ? 5 : oi.quantity_initial,
            // Kaos: 4 = 4 (match but still pending because ALL are pending when any mismatch)
            // Celana: 5 ≠ 3 (mismatch)
            status: "pending",
          },
        });
        // NO StationSummary — waiting for admin approval
      }
    }
    console.log(
      "  ✅ Order D4: washing mismatch (Celana 3→5) → adminMismatch endpoints",
    );

    // ─────────────────────────────────────────────────
    // ORDER D5: ironing_in_progress, NO ironing worker
    // Test: workerStation GET /available (ironing)
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D5_ID },
      update: {},
      create: {
        id: Seed.ORDER_D5_ID,
        customer_id: customerD.id,
        outlet_id: outletD.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 25000,
        total_amount: 35000,
        total_kilo: 3.0,
        status: "ironing_in_progress",
        washing_worker_id: workerD_Wash.id,
        washing_completed_at: new Date(),
        paid: false,
      },
    });

    await ensureOrderItems(Seed.ORDER_D5_ID, [
      { item_id: kaos.id, quantity_initial: 3 },
      { item_id: kemeja.id, quantity_initial: 2 },
    ]);
    console.log(
      "  ✅ Order D5: ironing available (washing done, no ironing worker) → GET /available",
    );

    // ─────────────────────────────────────────────────
    // ORDER D6: ironing_in_progress, reinput MISMATCH at ironing
    // Test: adminMismatch for ironing station (reads previous stationSummary)
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D6_ID },
      update: {},
      create: {
        id: Seed.ORDER_D6_ID,
        walkin_customer_id: walkInD.id,
        outlet_id: outletD.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 18000,
        total_amount: 18000,
        total_kilo: 2.0,
        status: "ironing_in_progress",
        washing_worker_id: workerD_Wash.id,
        washing_completed_at: new Date(),
        ironing_worker_id: workerD_Iron.id,
        paid: false,
      },
    });

    const orderD6Items = await ensureOrderItems(Seed.ORDER_D6_ID, [
      { item_id: celana.id, quantity_initial: 2 },
      { item_id: handuk.id, quantity_initial: 3 },
    ]);

    // First: create washing StationSummary (previous station data)
    const existingD6WashSummary = await prisma.stationSummary.findMany({
      where: { order_id: Seed.ORDER_D6_ID, station: "washing" },
    });
    if (existingD6WashSummary.length === 0) {
      for (const oi of orderD6Items) {
        await prisma.stationSummary.create({
          data: {
            order_id: Seed.ORDER_D6_ID,
            item_id: oi.item_id,
            station: "washing",
            latest_quantity: oi.quantity_initial,
          },
        });
      }
    }

    // Then: create ironing StationLogs with MISMATCH
    // Handuk: washing=3 but iron worker re-input=4 (mismatch)
    // Celana: washing=2, iron worker re-input=2 (match, but still pending)
    const existingD6IronLogs = await prisma.orderStationLog.findMany({
      where: { order_id: Seed.ORDER_D6_ID, station: "ironing" },
    });
    if (existingD6IronLogs.length === 0) {
      for (const oi of orderD6Items) {
        const isHanduk = oi.item_id === handuk.id;
        await prisma.orderStationLog.create({
          data: {
            order_id: Seed.ORDER_D6_ID,
            item_id: oi.item_id,
            station: "ironing",
            worker_id: workerD_Iron.id,
            quantity_input: isHanduk ? 4 : oi.quantity_initial,
            // Handuk: 4 ≠ 3 (mismatch), Celana: 2 = 2 (match but pending)
            status: "pending",
          },
        });
      }
    }
    console.log(
      "  ✅ Order D6: ironing mismatch (Handuk 3→4) → adminMismatch ironing station",
    );

    // ─────────────────────────────────────────────────
    // ORDER D7: packing_in_progress, packing worker assigned, reinput MATCH
    // Test: workerStation full packing flow (GET /active, POST /reinput, POST /complete)
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D7_ID },
      update: {},
      create: {
        id: Seed.ORDER_D7_ID,
        customer_id: customerD.id,
        outlet_id: outletD.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 35000,
        total_amount: 45000,
        total_kilo: 5.0,
        status: "packing_in_progress",
        washing_worker_id: workerD_Wash.id,
        washing_completed_at: new Date(),
        ironing_worker_id: workerD_Iron.id,
        ironing_completed_at: new Date(),
        packing_worker_id: workerD_Pack.id,
        paid: false,
      },
    });

    const orderD7Items = await ensureOrderItems(Seed.ORDER_D7_ID, [
      { item_id: kaos.id, quantity_initial: 6 },
      { item_id: selimut.id, quantity_initial: 2 },
      { item_id: handuk.id, quantity_initial: 3 },
    ]);

    // Create ironing StationSummary (previous station for packing)
    const existingD7IronSummary = await prisma.stationSummary.findMany({
      where: { order_id: Seed.ORDER_D7_ID, station: "ironing" },
    });
    if (existingD7IronSummary.length === 0) {
      for (const oi of orderD7Items) {
        await prisma.stationSummary.create({
          data: {
            order_id: Seed.ORDER_D7_ID,
            item_id: oi.item_id,
            station: "ironing",
            latest_quantity: oi.quantity_initial,
          },
        });
      }
    }

    // Create packing StationLogs + StationSummary (all match / approved)
    const existingD7PackLogs = await prisma.orderStationLog.findMany({
      where: { order_id: Seed.ORDER_D7_ID, station: "packing" },
    });
    if (existingD7PackLogs.length === 0) {
      for (const oi of orderD7Items) {
        await prisma.orderStationLog.create({
          data: {
            order_id: Seed.ORDER_D7_ID,
            item_id: oi.item_id,
            station: "packing",
            worker_id: workerD_Pack.id,
            quantity_input: oi.quantity_initial,
            status: "approved",
            approved_by: workerD_Pack.id,
            approved_at: new Date(),
          },
        });
        await prisma.stationSummary.create({
          data: {
            order_id: Seed.ORDER_D7_ID,
            item_id: oi.item_id,
            station: "packing",
            latest_quantity: oi.quantity_initial,
          },
        });
      }
    }
    console.log(
      "  ✅ Order D7: packing reinput match → full packing flow + POST /complete",
    );

    // ─────────────────────────────────────────────────
    // ORDER D8: washing_in_progress, COMPLEX mismatch
    //   - Kaos: initial=4, re-input=4 (match)
    //   - Celana: initial=3, re-input=7 (wrong qty)
    //   - Handuk: initial=2, re-input=2 (match)
    //   - Selimut: NOT in OrderItems but worker re-input 1 (unknown item)
    // Test: adminMismatch PUT with mixed accept/reject + summary
    // ─────────────────────────────────────────────────
    await prisma.order.upsert({
      where: { id: Seed.ORDER_D8_ID },
      update: {},
      create: {
        id: Seed.ORDER_D8_ID,
        walkin_customer_id: walkInD.id,
        outlet_id: outletD.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 42000,
        total_amount: 42000,
        total_kilo: 6.0,
        status: "washing_in_progress",
        washing_worker_id: workerD_Wash.id,
        paid: false,
      },
    });

    const orderD8Items = await ensureOrderItems(Seed.ORDER_D8_ID, [
      { item_id: kaos.id, quantity_initial: 4 },
      { item_id: celana.id, quantity_initial: 3 },
      { item_id: handuk.id, quantity_initial: 2 },
    ]);

    // Create StationLogs: 3 items in order + 1 unknown item (Selimut)
    const existingD8Logs = await prisma.orderStationLog.findMany({
      where: { order_id: Seed.ORDER_D8_ID },
    });
    if (existingD8Logs.length === 0) {
      // Match items: Kaos (4=4), Handuk (2=2)
      for (const oi of orderD8Items) {
        const isCelana = oi.item_id === celana.id;

        await prisma.orderStationLog.create({
          data: {
            order_id: Seed.ORDER_D8_ID,
            item_id: oi.item_id,
            station: "washing",
            worker_id: workerD_Wash.id,
            quantity_input: isCelana ? 7 : oi.quantity_initial,
            // Kaos: 4=4, Celana: 7≠3 (mismatch), Handuk: 2=2
            status: "pending",
          },
        });
      }

      // Unknown item: worker re-input Selimut which is NOT in OrderItems
      await prisma.orderStationLog.create({
        data: {
          order_id: Seed.ORDER_D8_ID,
          item_id: selimut.id,
          station: "washing",
          worker_id: workerD_Wash.id,
          quantity_input: 1,
          status: "pending",
        },
      });
    }
    console.log(
      "  ✅ Order D8: washing complex mismatch (3 order items + 1 unknown) → adminMismatch PUT",
    );

    // ═══════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════
    console.log("\n🎉 Fake data seed completed!");
    console.log("\n🔐 Test Accounts (password: password123):");
    console.log("   ┌─────────────────────────────────────────────────────┐");
    console.log("   │  Admin:  admind@laundry.com                         │");
    console.log("   │  Worker: washd@laundry.com  (station: washing)     │");
    console.log("   │  Worker: irond@laundry.com  (station: ironing)     │");
    console.log("   │  Worker: packd@laundry.com  (station: packing)     │");
    console.log("   │  Customer: budid@mail.com                          │");
    console.log(`   │  Outlet D ID: ${Seed.OUTLET_D_ID}  │`);
    console.log("   └─────────────────────────────────────────────────────┘");
    console.log("\n📦 Orders (all in Outlet D):");
    console.log(
      "   ┌──────┬───────────────────────────────────────────────────────┐",
    );
    console.log(
      "   │ D1   │ washing available (no worker)        → GET /available │",
    );
    console.log(
      "   │ D2   │ washing active (worker, no reinput)  → GET /active    │",
    );
    console.log(
      "   │ D3   │ washing match (reinput done)         → POST /complete  │",
    );
    console.log(
      "   │ D4   │ washing mismatch (Celana 3→5)        → adminMismatch   │",
    );
    console.log(
      "   │ D5   │ ironing available (washing done)     → GET /available │",
    );
    console.log(
      "   │ D6   │ ironing mismatch (Handuk 3→4)        → adminMismatch   │",
    );
    console.log(
      "   │ D7   │ packing match (all done)             → POST /complete  │",
    );
    console.log(
      "   │ D8   │ washing complex (3 items + unknown)  → adminMismatch   │",
    );
    console.log(
      "   └──────┴───────────────────────────────────────────────────────┘",
    );
    console.log("\n🧪 Testing Guide:");
    console.log("   adminMismatch:");
    console.log(`     GET  /api/admin/mismatch?outletId=${Seed.OUTLET_D_ID}`);
    console.log(
      `     GET  /api/admin/mismatch/${Seed.ORDER_D4_ID}/washing?outletId=${Seed.OUTLET_D_ID}`,
    );
    console.log(
      `     PUT  /api/admin/mismatch/${Seed.ORDER_D4_ID}/washing?outletId=${Seed.OUTLET_D_ID}`,
    );
    console.log("   workerStation (login as worker first):");
    console.log("     GET  /api/workers/available");
    console.log("     GET  /api/workers/active");
    console.log(`     POST /api/workers/accept/${Seed.ORDER_D1_ID}`);
    console.log(`     POST /api/workers/reinput/${Seed.ORDER_D2_ID}`);
    console.log(`     POST /api/workers/complete/${Seed.ORDER_D3_ID}`);
  }
}

Seed.main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
