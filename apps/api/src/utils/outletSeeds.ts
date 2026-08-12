import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/config/prisma";

export class OutletSeeder {
  static async run() {
    await prisma.outlet.createMany({
      data: [
        {
          name: "Outlet Laundry Ilir Barat",
          address: "Jl. Demang Lebar Daun, Ilir Barat I, Palembang",
          lat: new Prisma.Decimal("-2.9845123"),
          lng: new Prisma.Decimal("104.7423812"),
          max_distance_km: 5,
          price_per_km: 3000,
          price_per_kg: 7000,
        },
        {
          name: "Outlet Laundry Bukit Besar",
          address: "Jl. Srijaya Negara, Bukit Besar, Palembang",
          lat: new Prisma.Decimal("-2.9782341"),
          lng: new Prisma.Decimal("104.7489123"),
          max_distance_km: 4,
          price_per_km: 2800,
          price_per_kg: 6800,
        },
        {
          name: "Outlet Laundry Seberang Ulu",
          address: "Jl. KH Azhari, Seberang Ulu I, Palembang",
          lat: new Prisma.Decimal("-2.9912345"),
          lng: new Prisma.Decimal("104.7876543"),
          max_distance_km: 6,
          price_per_km: 3200,
          price_per_kg: 7200,
        },
        {
          name: "Outlet Laundry Plaju",
          address: "Jl. DI Panjaitan, Plaju, Palembang",
          lat: new Prisma.Decimal("-3.0043211"),
          lng: new Prisma.Decimal("104.8065432"),
          max_distance_km: 7,
          price_per_km: 3500,
          price_per_kg: 7500,
        },
        {
          name: "Outlet Laundry Sukarami",
          address: "Jl. Kol H Burlian, Sukarami, Palembang",
          lat: new Prisma.Decimal("-2.9498765"),
          lng: new Prisma.Decimal("104.7143219"),
          max_distance_km: 8,
          price_per_km: 3000,
          price_per_kg: 7000,
        },
        {
          name: "Outlet Laundry Alang-Alang Lebar",
          address: "Jl. Letjen Harun Sohar, Alang-Alang Lebar",
          lat: new Prisma.Decimal("-2.9432187"),
          lng: new Prisma.Decimal("104.6932184"),
          max_distance_km: 9,
          price_per_km: 2700,
          price_per_kg: 6500,
        },
        {
          name: "Outlet Laundry Kalidoni",
          address: "Jl. MP Mangkunegara, Kalidoni, Palembang",
          lat: new Prisma.Decimal("-2.9632198"),
          lng: new Prisma.Decimal("104.8232145"),
          max_distance_km: 6,
          price_per_km: 3100,
          price_per_kg: 7100,
        },
        {
          name: "Outlet Laundry Sematang Borang",
          address: "Jl. Tanjung Api-Api, Sematang Borang",
          lat: new Prisma.Decimal("-2.9254321"),
          lng: new Prisma.Decimal("104.8612345"),
          max_distance_km: 10,
          price_per_km: 2600,
          price_per_kg: 6400,
        },
        {
          name: "Outlet Laundry Kertapati",
          address: "Jl. Ki Marogan, Kertapati, Palembang",
          lat: new Prisma.Decimal("-3.0123456"),
          lng: new Prisma.Decimal("104.7765432"),
          max_distance_km: 5,
          price_per_km: 3300,
          price_per_kg: 7300,
        },
        {
          name: "Outlet Laundry Gandus",
          address: "Jl. Lettu Karim Kadir, Gandus, Palembang",
          lat: new Prisma.Decimal("-2.9856789"),
          lng: new Prisma.Decimal("104.7123456"),
          max_distance_km: 7,
          price_per_km: 2900,
          price_per_kg: 6900,
        },
      ],
    });

    console.log("✅ Seeded 10 outlets in Palembang");
  }
}

OutletSeeder.run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
