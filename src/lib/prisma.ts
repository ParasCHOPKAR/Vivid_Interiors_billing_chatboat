import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function resolveDatabaseUrl(): string {
  if (process.env.VERCEL) {
    // Vercel serverless environment: root is read-only, copy seeded db to writable /tmp
    const tmpDbPath = path.join("/tmp", "dev.db");
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
      ];
      for (const src of candidates) {
        if (fs.existsSync(/*turbopackIgnore: true*/ src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            break;
          } catch (e) {
            console.warn("Could not copy database to /tmp:", e);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: dbUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
