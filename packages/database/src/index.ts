import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
    // Check if we're using Turso (libsql URL)
    const dbUrl = process.env.DATABASE_URL || "";

    if (dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://")) {
        // Production: Use Turso with libSQL adapter
        const adapter = new PrismaLibSql({
            url: dbUrl,
            authToken: process.env.DATABASE_AUTH_TOKEN,
        });

        return new PrismaClient({ adapter } as any);
    } else {
        // Development: Use local SQLite
        return new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query"] : [],
        });
    }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
