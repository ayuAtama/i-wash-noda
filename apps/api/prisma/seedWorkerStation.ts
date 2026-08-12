import { prisma } from "../src/config/prisma";
import bcrypt from "bcrypt";

const WORKER_PASSWORD = "password123";
const BCRYPT_ROUNDS = 10;

export class Seed {
  static async main() {
    console.log("🏗️  Seeding workerStation fake data...");

    const hashedPassword = await bcrypt.hash(WORKER_PASSWORD, BCRYPT_ROUNDS);

    // ─────────────────────────────────────────────────
    // OUTLET C
    // ─────────────────────────────────────────────────
    const outletC = await prisma.outlet.upsert({
      where: { id: "00000000-0000-0000-0000-0000000000c0" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-0000000000c0",
        name: "Outlet Laundry C (Testing)",
        address: "Jl. Testing No. 99",
        lat: -6.21,
        lng: 106.83,
        max_distance_km: 20,
        price_per_km: 2000,
        price_per_kg: 7000,
      },
    });
    console.log(`  ✅ Outlet C: ${outletC.id}`);

    // ─────────────────────────────────────────────────
    // OUTLET ADMIN C
    // ─────────────────────────────────────────────────
    const adminC = await prisma.user.upsert({
      where: { email: "adminC@laundry.com" },
      update: {},
      create: {
        name: "Admin Outlet C",
        email: "adminC@laundry.com",
        role: "outlet_admin",
        outlet_id: outletC.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });
    console.log(`  ✅ Admin C: ${adminC.id}`);

    // ─────────────────────────────────────────────────
    // WORKERS OUTLET C
    // ─────────────────────────────────────────────────
    const workerC_Wash = await prisma.user.upsert({
      where: { email: "washC@laundry.com" },
      update: {},
      create: {
        name: "Worker C - Washing",
        email: "washC@laundry.com",
        role: "worker",
        worker_station: "washing",
        outlet_id: outletC.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const workerC_Iron = await prisma.user.upsert({
      where: { email: "ironC@laundry.com" },
      update: {},
      create: {
        name: "Worker C - Ironing",
        email: "ironC@laundry.com",
        role: "worker",
        worker_station: "ironing",
        outlet_id: outletC.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const workerC_Pack = await prisma.user.upsert({
      where: { email: "packC@laundry.com" },
      update: {},
      create: {
        name: "Worker C - Packing",
        email: "packC@laundry.com",
        role: "worker",
        worker_station: "packing",
        outlet_id: outletC.id,
        password: hashedPassword,
        emailVerified: true,
      },
    });
    console.log(
      `  ✅ Workers: washC=${workerC_Wash.id}, ironC=${workerC_Iron.id}, packC=${workerC_Pack.id}`,
    );

    // ─────────────────────────────────────────────────
    // CUSTOMER APP (Customer with account)
    // ─────────────────────────────────────────────────
    const customerAndi = await prisma.user.upsert({
      where: { email: "andi@mail.com" },
      update: {},
      create: {
        name: "Andi Saputra",
        email: "andi@mail.com",
        role: "customer",
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const addressAndi = await prisma.userAddress.upsert({
      where: { id: "00000000-0000-0000-0000-00000000b001" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-00000000b001",
        user_id: customerAndi.id,
        label: "Kantor",
        address: "Jl. Sudirman No. 45",
        lat: -6.205,
        lng: 106.825,
        is_default: true,
      },
    });
    console.log(`  ✅ Customer Andi: ${customerAndi.id}`);

    // ─────────────────────────────────────────────────
    // WALK-IN CUSTOMER
    // ─────────────────────────────────────────────────
    const walkInCustomer = await prisma.walkInCustomer.upsert({
      where: { phone: "081234567890" },
      update: {},
      create: {
        name: "Toko Bersama",
        phone: "081234567890",
        created_by: adminC.id,
        outlet_id: outletC.id,
      },
    });
    console.log(`  ✅ Walk-in Customer: ${walkInCustomer.id}`);

    // ─────────────────────────────────────────────────
    // ALL ITEMS (findFirst + conditional create)
    // ─────────────────────────────────────────────────
    const allItemNames = [
      "Kaos",
      "Celana",
      "Handuk",
      "Jas",
      "Rok",
      "Selimut",
      "Daster",
      "Kemeja",
    ];
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
    const itemJas = items["Jas"];
    const itemRok = items["Rok"];
    const itemSelimut = items["Selimut"];
    const itemDaster = items["Daster"];
    const itemKemeja = items["Kemeja"];
    console.log("  ✅ All items ready (8 items)");

    // ─────────────────────────────────────────────────
    // WORKER SHIFTS (all workers, Saturday)
    // ─────────────────────────────────────────────────
    const shifts = [
      {
        worker_id: workerC_Wash.id,
        station: "washing" as const,
        day: "sat" as const,
      },
      {
        worker_id: workerC_Iron.id,
        station: "ironing" as const,
        day: "sat" as const,
      },
      {
        worker_id: workerC_Pack.id,
        station: "packing" as const,
        day: "sat" as const,
      },
    ];

    for (const s of shifts) {
      const existing = await prisma.workerShift.findFirst({
        where: {
          worker_id: s.worker_id,
          outlet_id: outletC.id,
          day_of_week: s.day,
        },
      });
      if (!existing) {
        await prisma.workerShift.create({
          data: {
            worker_id: s.worker_id,
            outlet_id: outletC.id,
            station: s.station,
            day_of_week: s.day,
            start_time: new Date("2024-01-01T08:00:00Z"),
            end_time: new Date("2024-01-01T16:00:00Z"),
          },
        });
      }
    }
    console.log("  ✅ Worker shifts created (Saturday)");

    // ═══════════════════════════════════════════════════
    // ORDERS
    // ═══════════════════════════════════════════════════

    // ─────────────────────────────────────────────────
    // ORDER 6: washing_in_progress, NO worker assigned
    // Purpose: GET /available untuk washing worker
    // ─────────────────────────────────────────────────
    const order6 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000006" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000006",
        customer_id: customerAndi.id,
        outlet_id: outletC.id,
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

    const existingOrder6Items = await prisma.orderItem.findMany({
      where: { order_id: order6.id },
    });
    if (existingOrder6Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order6.id, item_id: kaos.id, quantity_initial: 4 },
          { order_id: order6.id, item_id: celana.id, quantity_initial: 2 },
          { order_id: order6.id, item_id: handuk.id, quantity_initial: 1 },
        ],
      });
    }
    console.log("  ✅ Order 6: washing_in_progress (available, no worker)");

    // ─────────────────────────────────────────────────
    // ORDER 7: washing_in_progress, worker assigned, NO reinput yet
    // Purpose: GET /active untuk washing worker + test reinput awal
    // ─────────────────────────────────────────────────
    const order7 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000007" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000007",
        walkin_customer_id: walkInCustomer.id,
        outlet_id: outletC.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 15000,
        total_amount: 15000,
        total_kilo: 2.0,
        status: "washing_in_progress",
        washing_worker_id: workerC_Wash.id,
        paid: false,
      },
    });

    const existingOrder7Items = await prisma.orderItem.findMany({
      where: { order_id: order7.id },
    });
    if (existingOrder7Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order7.id, item_id: kaos.id, quantity_initial: 3 },
          { order_id: order7.id, item_id: itemRok.id, quantity_initial: 1 },
        ],
      });
    }
    console.log(
      "  ✅ Order 7: washing_in_progress (active, worker assigned, no reinput)",
    );

    // ─────────────────────────────────────────────────
    // ORDER 8: washing_in_progress, worker assigned, reinput DONE (all MATCH)
    // Purpose: Test markJobAsDone (should succeed)
    // ─────────────────────────────────────────────────
    const order8 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000008" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000008",
        customer_id: customerAndi.id,
        outlet_id: outletC.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 30000,
        total_amount: 40000,
        total_kilo: 4.0,
        status: "washing_in_progress",
        washing_worker_id: workerC_Wash.id,
        paid: false,
      },
    });

    const existingOrder8Items = await prisma.orderItem.findMany({
      where: { order_id: order8.id },
    });
    if (existingOrder8Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order8.id, item_id: kaos.id, quantity_initial: 5 },
          { order_id: order8.id, item_id: celana.id, quantity_initial: 3 },
        ],
      });

      // Reinsert to get IDs
      const order8Items = await prisma.orderItem.findMany({
        where: { order_id: order8.id },
      });

      // Create StationLogs (approved - all match)
      for (const oi of order8Items) {
        await prisma.orderStationLog.create({
          data: {
            order_id: order8.id,
            item_id: oi.item_id,
            station: "washing",
            worker_id: workerC_Wash.id,
            quantity_input: oi.quantity_initial,
            status: "approved",
            approved_by: workerC_Wash.id,
            approved_at: new Date(),
          },
        });

        await prisma.stationSummary.create({
          data: {
            order_id: order8.id,
            item_id: oi.item_id,
            station: "washing",
            latest_quantity: oi.quantity_initial,
          },
        });
      }
    }
    console.log(
      "  ✅ Order 8: washing_in_progress (reinput match, ready for markJobAsDone)",
    );

    // ─────────────────────────────────────────────────
    // ORDER 9: washing_in_progress, worker assigned, reinput DONE (MISMATCH/PENDING)
    // Purpose: Test markJobAsDone (should FAIL - pending logs block it)
    // ─────────────────────────────────────────────────
    const order9 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000009" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000009",
        walkin_customer_id: walkInCustomer.id,
        outlet_id: outletC.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 20000,
        total_amount: 20000,
        total_kilo: 2.5,
        status: "washing_in_progress",
        washing_worker_id: workerC_Wash.id,
        paid: false,
      },
    });

    const existingOrder9Items = await prisma.orderItem.findMany({
      where: { order_id: order9.id },
    });
    if (existingOrder9Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order9.id, item_id: itemJas.id, quantity_initial: 2 },
          { order_id: order9.id, item_id: itemSelimut.id, quantity_initial: 1 },
        ],
      });

      const order9Items = await prisma.orderItem.findMany({
        where: { order_id: order9.id },
      });

      // Create StationLogs with MISMATCH (pending)
      // Item 1 (Jas): admin says 2, worker re-input 3 → mismatch
      // Item 2 (Selimut): admin says 1, worker re-input 1 → match, but since ANY mismatch → all pending
      for (const oi of order9Items) {
        const isJas = oi.item_id === itemJas.id;
        await prisma.orderStationLog.create({
          data: {
            order_id: order9.id,
            item_id: oi.item_id,
            station: "washing",
            worker_id: workerC_Wash.id,
            quantity_input: isJas ? 3 : 1, // Jas: 3 ≠ 2 (mismatch), Selimut: 1 = 1
            status: "pending", // all pending because of mismatch
          },
        });

        // NO StationSummary created for mismatch scenario
      }
    }
    console.log(
      "  ✅ Order 9: washing_in_progress (reinput mismatch/pending, blocks markJobAsDone)",
    );

    // ─────────────────────────────────────────────────
    // ORDER 10: ironing_in_progress, NO ironing worker assigned
    // Purpose: GET /available untuk ironing worker
    // ─────────────────────────────────────────────────
    const order10 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000010" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000010",
        customer_id: customerAndi.id,
        outlet_id: outletC.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 25000,
        total_amount: 35000,
        total_kilo: 3.0,
        status: "ironing_in_progress",
        washing_worker_id: workerC_Wash.id,
        washing_completed_at: new Date(),
        paid: false,
      },
    });

    const existingOrder10Items = await prisma.orderItem.findMany({
      where: { order_id: order10.id },
    });
    if (existingOrder10Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order10.id, item_id: kaos.id, quantity_initial: 3 },
          { order_id: order10.id, item_id: itemKemeja.id, quantity_initial: 2 },
        ],
      });
    }
    console.log(
      "  ✅ Order 10: ironing_in_progress (available, no ironing worker)",
    );

    // ─────────────────────────────────────────────────
    // ORDER 11: ironing_in_progress, ironing worker assigned, reinput DONE (match)
    // Purpose: GET /active for ironing + test markJobAsDone for ironing
    // ─────────────────────────────────────────────────
    const order11 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000011" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000011",
        walkin_customer_id: walkInCustomer.id,
        outlet_id: outletC.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 18000,
        total_amount: 18000,
        total_kilo: 2.0,
        status: "ironing_in_progress",
        washing_worker_id: workerC_Wash.id,
        washing_completed_at: new Date(),
        ironing_worker_id: workerC_Iron.id,
        paid: false,
      },
    });

    const existingOrder11Items = await prisma.orderItem.findMany({
      where: { order_id: order11.id },
    });
    if (existingOrder11Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order11.id, item_id: celana.id, quantity_initial: 2 },
          { order_id: order11.id, item_id: itemDaster.id, quantity_initial: 2 },
        ],
      });

      const order11Items = await prisma.orderItem.findMany({
        where: { order_id: order11.id },
      });

      for (const oi of order11Items) {
        await prisma.orderStationLog.create({
          data: {
            order_id: order11.id,
            item_id: oi.item_id,
            station: "ironing",
            worker_id: workerC_Iron.id,
            quantity_input: oi.quantity_initial,
            status: "approved",
            approved_by: workerC_Iron.id,
            approved_at: new Date(),
          },
        });

        await prisma.stationSummary.create({
          data: {
            order_id: order11.id,
            item_id: oi.item_id,
            station: "ironing",
            latest_quantity: oi.quantity_initial,
          },
        });
      }
    }
    console.log(
      "  ✅ Order 11: ironing_in_progress (reinput match, ready for markJobAsDone)",
    );

    // ─────────────────────────────────────────────────
    // ORDER 12: packing_in_progress, NO packing worker assigned
    // Purpose: GET /available untuk packing worker
    // ─────────────────────────────────────────────────
    const order12 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000012" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000012",
        customer_id: customerAndi.id,
        outlet_id: outletC.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 35000,
        total_amount: 45000,
        total_kilo: 5.0,
        status: "packing_in_progress",
        washing_worker_id: workerC_Wash.id,
        washing_completed_at: new Date(),
        ironing_worker_id: workerC_Iron.id,
        ironing_completed_at: new Date(),
        paid: false,
      },
    });

    const existingOrder12Items = await prisma.orderItem.findMany({
      where: { order_id: order12.id },
    });
    if (existingOrder12Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order12.id, item_id: kaos.id, quantity_initial: 6 },
          {
            order_id: order12.id,
            item_id: itemSelimut.id,
            quantity_initial: 2,
          },
          { order_id: order12.id, item_id: handuk.id, quantity_initial: 3 },
        ],
      });
    }
    console.log(
      "  ✅ Order 12: packing_in_progress (available, no packing worker)",
    );

    // ─────────────────────────────────────────────────
    // ORDER 13: packing_in_progress, packing worker assigned, reinput DONE (match)
    // Purpose: GET /active for packing + test markJobAsDone for packing
    // ─────────────────────────────────────────────────
    const order13 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000013" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000013",
        walkin_customer_id: walkInCustomer.id,
        outlet_id: outletC.id,
        source: "walk_in",
        pickup_fee: 0,
        delivery_fee: 0,
        laundry_price: 12000,
        total_amount: 12000,
        total_kilo: 1.5,
        status: "packing_in_progress",
        washing_worker_id: workerC_Wash.id,
        washing_completed_at: new Date(),
        ironing_worker_id: workerC_Iron.id,
        ironing_completed_at: new Date(),
        packing_worker_id: workerC_Pack.id,
        paid: false,
      },
    });

    const existingOrder13Items = await prisma.orderItem.findMany({
      where: { order_id: order13.id },
    });
    if (existingOrder13Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order13.id, item_id: itemKemeja.id, quantity_initial: 2 },
          { order_id: order13.id, item_id: itemDaster.id, quantity_initial: 1 },
        ],
      });

      const order13Items = await prisma.orderItem.findMany({
        where: { order_id: order13.id },
      });

      for (const oi of order13Items) {
        await prisma.orderStationLog.create({
          data: {
            order_id: order13.id,
            item_id: oi.item_id,
            station: "packing",
            worker_id: workerC_Pack.id,
            quantity_input: oi.quantity_initial,
            status: "approved",
            approved_by: workerC_Pack.id,
            approved_at: new Date(),
          },
        });

        await prisma.stationSummary.create({
          data: {
            order_id: order13.id,
            item_id: oi.item_id,
            station: "packing",
            latest_quantity: oi.quantity_initial,
          },
        });
      }
    }
    console.log(
      "  ✅ Order 13: packing_in_progress (reinput match, ready for markJobAsDone)",
    );

    // ─────────────────────────────────────────────────
    // ORDER 14: washing_in_progress, reinput mismatch on MULTIPLE items
    // Purpose: Test mismatch with 3 items, 1 correct + 1 incorrect qty + 1 unknown item
    // ─────────────────────────────────────────────────
    const order14 = await prisma.order.upsert({
      where: { id: "00000000-0000-0000-0000-000000000014" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000014",
        customer_id: customerAndi.id,
        outlet_id: outletC.id,
        source: "customer_app",
        pickup_fee: 5000,
        delivery_fee: 5000,
        laundry_price: 42000,
        total_amount: 52000,
        total_kilo: 6.0,
        status: "washing_in_progress",
        washing_worker_id: workerC_Wash.id,
        paid: false,
      },
    });

    const existingOrder14Items = await prisma.orderItem.findMany({
      where: { order_id: order14.id },
    });
    if (existingOrder14Items.length === 0) {
      await prisma.orderItem.createMany({
        data: [
          { order_id: order14.id, item_id: kaos.id, quantity_initial: 4 },
          { order_id: order14.id, item_id: celana.id, quantity_initial: 2 },
          { order_id: order14.id, item_id: itemJas.id, quantity_initial: 1 },
        ],
      });

      const order14Items = await prisma.orderItem.findMany({
        where: { order_id: order14.id },
      });

      // Scenario: Kaos matched, Celana mismatch, Jas correct
      for (const oi of order14Items) {
        const isCelana = oi.item_id === celana.id;
        const isKaos = oi.item_id === kaos.id;

        await prisma.orderStationLog.create({
          data: {
            order_id: order14.id,
            item_id: oi.item_id,
            station: "washing",
            worker_id: workerC_Wash.id,
            quantity_input: isCelana ? 5 : oi.quantity_initial, // Celana: admin=2, worker=5 → mismatch
            status: isCelana ? "pending" : "approved",
            ...(isKaos && {
              approved_by: workerC_Wash.id,
              approved_at: new Date(),
            }),
          },
        });

        // StationSummary only for matched items
        if (!isCelana) {
          await prisma.stationSummary.create({
            data: {
              order_id: order14.id,
              item_id: oi.item_id,
              station: "washing",
              latest_quantity: oi.quantity_initial,
            },
          });
        }
      }
    }
    console.log(
      "  ✅ Order 14: washing_in_progress (mixed match/mismatch reinput)",
    );

    // ═══════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════
    console.log("\n🎉 Worker Station seed data created!");
    console.log("\n📋 Test Accounts (password: password123):");
    console.log("   Workers:");
    console.log(
      `     Washing: washC@laundry.com (station: washing, outlet: ${outletC.id})`,
    );
    console.log(
      `     Ironing: ironC@laundry.com (station: ironing, outlet: ${outletC.id})`,
    );
    console.log(
      `     Packing: packC@laundry.com (station: packing, outlet: ${outletC.id})`,
    );
    console.log("   Admin:");
    console.log(`     Outlet C: adminC@laundry.com`);
    console.log("   Customer:");
    console.log(`     Andi: andi@mail.com`);
    console.log("\n📦 Orders Summary:");
    console.log(
      "   Order 6: washing available (no worker) → test GET /available",
    );
    console.log(
      "   Order 7: washing active (worker assigned) → test GET /active + reinput",
    );
    console.log(
      "   Order 8: washing reinput DONE (match) → test markJobAsDone ✅",
    );
    console.log(
      "   Order 9: washing reinput DONE (mismatch) → test markJobAsDone ❌",
    );
    console.log(
      "   Order 10: ironing available (washing done, no ironing worker)",
    );
    console.log("   Order 11: ironing reinput DONE (match)");
    console.log(
      "   Order 12: packing available (washing+ironing done, no packing worker)",
    );
    console.log("   Order 13: packing reinput DONE (match)");
    console.log("   Order 14: washing reinput MIXED (Kaos✅ Celana❌ Jas✅)");
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
