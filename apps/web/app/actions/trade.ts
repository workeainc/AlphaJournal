"use server";

import { prisma } from "@repo/database";
import { calculateQualityScore, validateChecklistComplete, type ChecklistResponse } from "@repo/core";
import { getDefaultAccount } from "./user";
import { getDefaultChecklist } from "./checklist";

export interface CreateTradeInput {
    symbol: string;
    direction: "LONG" | "SHORT";
    entryPrice: number;
    stopLoss: number;
    targetPrice?: number;
    quantity: number;
    riskAmount: number;
    checklistResponses: ChecklistResponse[];
    notes?: string;
    tradingViewLink?: string;
    tags?: string[];
    mood?: string;
}

/**
 * Create a new trade with checklist validation
 */
export async function createTrade(input: CreateTradeInput) {
    // 1. Get default account
    const account = await getDefaultAccount();

    // 2. Get default checklist
    const checklist = await getDefaultChecklist();

    // 3. Validate checklist is complete
    const validation = validateChecklistComplete(
        input.checklistResponses,
        checklist.items.map((item: any) => ({
            id: item.id,
            label: item.label,
            description: item.description || undefined,
            type: item.type as "YES_NO" | "MULTIPLE_CHOICE" | "TEXT",
            weight: item.weight,
            required: item.required,
            options: item.options ? JSON.parse(item.options) : undefined,
        }))
    );

    if (!validation.isValid) {
        throw new Error(
            `Checklist incomplete. Missing items: ${validation.missingItems.join(", ")}`
        );
    }

    // 4. Calculate quality score
    const scoreResult = calculateQualityScore(
        input.checklistResponses,
        checklist.items.map((item: any) => ({
            id: item.id,
            label: item.label,
            description: item.description || undefined,
            type: item.type as "YES_NO" | "MULTIPLE_CHOICE" | "TEXT",
            weight: item.weight,
            required: item.required,
            options: item.options ? JSON.parse(item.options) : undefined,
        }))
    );

    // 5. Calculate Planned RR
    let plannedRR: number | undefined = undefined;
    if (input.targetPrice) {
        const risk = Math.abs(input.entryPrice - input.stopLoss);
        const reward = Math.abs(input.targetPrice - input.entryPrice);
        if (risk > 0) {
            plannedRR = reward / risk;
        }
    }

    // 6. Create trade and checklist response in a transaction
    const trade = await prisma.$transaction(async (tx: any) => {
        // Create the trade
        const newTrade = await tx.trade.create({
            data: {
                accountId: account.id,
                symbol: input.symbol.toUpperCase(),
                direction: input.direction,
                entryPrice: input.entryPrice,
                stopLoss: input.stopLoss,
                targetPrice: input.targetPrice,
                plannedRR: plannedRR,
                quantity: input.quantity,
                riskAmount: input.riskAmount,
                checklistScore: scoreResult.score,
                notes: input.notes,
                tradingViewLink: input.tradingViewLink,
                mood: input.mood,
                status: "OPEN",
                tags: {
                    connectOrCreate: input.tags?.map(name => ({
                        where: { name: name.toUpperCase() },
                        create: { name: name.toUpperCase() }
                    }))
                }
            },
        });

        // Create checklist response
        await tx.tradeChecklistResponse.create({
            data: {
                tradeId: newTrade.id,
                responses: JSON.stringify(
                    input.checklistResponses.reduce(
                        (acc, r) => ({ ...acc, [r.itemId]: r.value }),
                        {}
                    )
                ),
                score: scoreResult.score,
            },
        });

        // Update account balance (deduct margin)
        // For now, we'll just deduct the risk amount
        // In a real system, you'd calculate margin based on leverage
        await tx.tradingAccount.update({
            where: { id: account.id },
            data: {
                balance: {
                    decrement: input.riskAmount,
                },
            },
        });

        return newTrade;
    });

    return {
        trade,
        qualityScore: scoreResult,
    };
}

/**
 * Get all trades for the default account
 */
export async function getTrades() {
    const account = await getDefaultAccount();

    const trades = await prisma.trade.findMany({
        where: { accountId: account.id },
        include: {
            checklistResponse: true,
            tags: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return trades;
}

/**
 * Get a single trade by ID
 */
export async function getTradeById(id: string) {
    const trade = await prisma.trade.findUnique({
        where: { id },
        include: {
            checklistResponse: true,
            account: true,
            tags: true,
        },
    });

    return trade;
}
/**
 * Close a trade and realize PnL
 */
export async function closeTrade(id: string, exitPrice: number) {
    const trade = await prisma.trade.findUnique({
        where: { id },
        include: { account: true },
    });

    if (!trade) throw new Error("Trade not found");
    if (trade.status === "CLOSED") throw new Error("Trade already closed");

    // Calculate PnL
    // Long: (Exit - Entry) * Qty
    // Short: (Entry - Exit) * Qty
    const pnl = trade.direction === "LONG"
        ? (exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - exitPrice) * trade.quantity;

    return await prisma.$transaction(async (tx: any) => {
        // 1. Update trade status
        const updatedTrade = await tx.trade.update({
            where: { id },
            data: {
                status: "CLOSED",
                exitPrice,
                pnl,
            },
        });

        // 2. Update account balance (return margin + add/subtract PnL)
        const newBalance = trade.account.balance + trade.riskAmount + pnl;

        await tx.tradingAccount.update({
            where: { id: trade.accountId },
            data: {
                balance: newBalance,
            },
        });

        // 3. Create a balance snapshot for the equity curve
        await tx.balanceSnapshot.create({
            data: {
                accountId: trade.accountId,
                balance: newBalance,
                pnl: pnl,
            },
        });

        return updatedTrade;
    });
}
