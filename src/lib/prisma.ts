import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/config/env";

let prismaInstance: PrismaClient | undefined;

export const getPrisma = (): PrismaClient => {
  if (!prismaInstance) {
    const connectionString = env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: keyof PrismaClient) {
    const instance = getPrisma();
    const value = instance[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export default prisma;
