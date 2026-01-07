"use server";

import { prisma, redis } from "@repo/database";

/**
 * Get the default pre-trade checklist
 */
export async function getDefaultChecklist() {
    const CACHE_KEY = "checklist:default";

    // Try to get from cache first
    if (redis) {
        try {
            const cached = await redis.get(CACHE_KEY);
            if (cached) {
                console.log("🚀 Serving checklist from cache");
                return cached as any;
            }
        } catch (e) {
            console.error("Redis error:", e);
        }
    }

    const checklist = await prisma.preTradeChecklist.findFirst({
        where: { isDefault: true },
        include: {
            items: {
                orderBy: { order: "asc" },
            },
        },
    });

    if (!checklist) {
        throw new Error("Default checklist not found. Please run db:seed");
    }

    // Store in cache for 1 hour
    if (redis) {
        try {
            await redis.set(CACHE_KEY, checklist, { ex: 3600 });
            console.log("💾 Checklist cached");
        } catch (e) {
            console.error("Redis cache error:", e);
        }
    }

    return checklist;
}

/**
 * Get a specific checklist by ID
 */
export async function getChecklistById(id: string) {
    const checklist = await prisma.preTradeChecklist.findUnique({
        where: { id },
        include: {
            items: {
                orderBy: { order: "asc" },
            },
        },
    });

    return checklist;
}
