"use server";

import { prisma } from "@repo/database";

import { auth } from "@/auth";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
    const session = await auth();

    if (!session?.user?.email) {
        // For development/transition, return mock if no session
        // return await prisma.user.findUnique({ where: { email: "trader@alphajournal.com" }, include: { tradingAccounts: true } });
        throw new Error("Not authenticated");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            tradingAccounts: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
}

/**
 * Get the default account for the current user
 */
export async function getDefaultAccount() {
    const user = await getCurrentUser();

    let account = await prisma.tradingAccount.findFirst({
        where: { userId: user.id },
    });

    // If no account exists for this user (new user), create a default one
    if (!account) {
        account = await prisma.tradingAccount.create({
            data: {
                name: "Primary Account",
                balance: user.initialBalance,
                currency: user.currency,
                userId: user.id,
            },
        });
    }

    return account;
}

/**
 * Update user trading profile
 */
export async function updateUserProfile(data: {
    initialBalance?: number;
    currency?: string;
    riskTolerance?: number;
}) {
    const user = await getCurrentUser();

    return await prisma.user.update({
        where: { id: user.id },
        data,
    });
}
