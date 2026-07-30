// apps/api/src/config/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export class PrismaWrapper extends PrismaClient {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      }),
    });
  }
}

const prisma = new PrismaWrapper();
export { prisma };

// import "dotenv/config";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "@/generated/prisma/client";

// const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

// export { prisma };

// export class ALAMAK extends PrismaClient {
//   constructor() {
//     super({
//       adapter: new PrismaPg({
//         connectionString: process.env.DATABASE_URL!,
//       }),
//     });
//   }
// }

// export const Prisma = new ALAMAK();

// export class AnakAyam {
//   private prisma: PrismaClient;
//   private adapter: PrismaPg;

//   constructor() {
//     this.adapter = new PrismaPg({
//       connectionString: process.env.DATABASE_URL!,
//     });
//     this.prisma = new PrismaClient({ adapter: this.adapter });
//   }

//   get client() {
//     return this.prisma;
//   }
// }

// export const anakAyam = new AnakAyam();
