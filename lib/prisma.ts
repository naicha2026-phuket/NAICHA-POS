import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prisma: PrismaClient;
let pool: Pool;

// Pool configuration with minimal connections
const poolConfig = {
  connectionString,
  max: 1, // Minimal connections
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
};

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool(poolConfig);
  }
  pool = globalForPrisma.pool;

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ 
      adapter,
      log: ['error', 'warn'],
    });
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
