"use server";

import { prisma } from "@repo/database";

/**
 * Get the default pre-trade checklist
 */
export async function getDefaultChecklist() {
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
