"use server";

import { prisma } from "@repo/database";
import { getCurrentUser } from "./user";

/**
 * Get balance history for the portfolio chart
 */
/**
 * Get balance history based on closed trades
 */
export async function getBalanceHistory() {
    const user = await getCurrentUser();

    // Start with initial balance
    const initialPoint = {
        balance: user.initialBalance,
        timestamp: user.createdAt,
        pnl: 0,
        tradeId: undefined
    };

    const trades = await prisma.trade.findMany({
        where: {
            account: { userId: user.id },
            status: "CLOSED",
        },
        orderBy: { updatedAt: "asc" },
        select: {
            id: true,
            pnl: true,
            updatedAt: true
        }
    });

    const history = [initialPoint];
    let currentBalance = user.initialBalance;

    trades.forEach((trade: any) => {
        currentBalance += (trade.pnl || 0);
        history.push({
            balance: currentBalance,
            timestamp: trade.updatedAt,
            pnl: trade.pnl,
            tradeId: trade.id
        });
    });

    // If only initial point, add a current point for visualization if needed, 
    // but better to just return what we have.

    return history;
}

/**
 * Get consolidated performance metrics
 */
export async function getPerformanceStats() {
    const user = await getCurrentUser();

    // Use regular aggregate for basic stats
    const stats = await prisma.trade.aggregate({
        where: {
            account: { userId: user.id },
            status: "CLOSED"
        },
        _sum: {
            pnl: true,
            riskAmount: true
        },
        _count: {
            id: true
        },
        _avg: {
            checklistScore: true
        }
    });

    const winningTrades = await prisma.trade.count({
        where: {
            account: { userId: user.id },
            status: "CLOSED",
            pnl: { gt: 0 }
        }
    });

    const losingTrades = await prisma.trade.count({
        where: {
            account: { userId: user.id },
            status: "CLOSED",
            pnl: { lt: 0 }
        }
    });

    const totalTrades = stats._count.id;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Calculate Profit Factor
    const wins = await prisma.trade.aggregate({
        where: { account: { userId: user.id }, status: "CLOSED", pnl: { gt: 0 } },
        _sum: { pnl: true }
    });

    const losses = await prisma.trade.aggregate({
        where: { account: { userId: user.id }, status: "CLOSED", pnl: { lt: 0 } },
        _sum: { pnl: true }
    });

    const totalWins = wins._sum.pnl || 0;
    const totalLosses = Math.abs(losses._sum.pnl || 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 100 : 0;

    // Max Drawdown Calculation using Trade History (more accurate)
    const history = await getBalanceHistory();
    let peak = user.initialBalance;
    let maxDrawdown = 0;

    history.forEach((point) => {
        if (point.balance > peak) {
            peak = point.balance;
        }
        const currentDrawdown = peak > 0 ? (peak - point.balance) / peak : 0;
        if (currentDrawdown > maxDrawdown) {
            maxDrawdown = currentDrawdown;
        }
    });

    // Expectancy
    const totalPnL = stats._sum.pnl || 0;
    const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;

    // RR Realization
    const tradesWithRR = await prisma.trade.findMany({
        where: {
            account: { userId: user.id },
            status: "CLOSED",
            plannedRR: { not: null },
            riskAmount: { gt: 0 }
        }
    });

    let totalRRRealization = 0;
    tradesWithRR.forEach((t: any) => {
        const actualRR = t.pnl / t.riskAmount;
        const realization = t.plannedRR > 0 ? actualRR / t.plannedRR : 0;
        totalRRRealization += realization;
    });

    const avgRRRealization = tradesWithRR.length > 0 ? totalRRRealization / tradesWithRR.length : 0;

    return {
        totalTrades,
        winRate,
        profitFactor,
        totalPnL,
        avgQuality: stats._avg.checklistScore || 0,
        totalWins,
        totalLosses,
        winningTrades,
        losingTrades,
        expectancy,
        maxDrawdown: maxDrawdown * 100,
        avgRRRealization: avgRRRealization * 100
    };
}

/**
 * Get daily PnL map for the calendar view
 */
export async function getDailyPnl(month: number, year: number) {
    const user = await getCurrentUser();

    // Calculate start and end dates for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
        where: {
            account: { userId: user.id },
            status: "CLOSED",
            updatedAt: {
                gte: startDate,
                lte: endDate
            }
        },
        select: {
            pnl: true,
            updatedAt: true
        }
    });

    // Map: day number -> cumulative PnL
    const dailyPnl: Record<number, number> = {};

    trades.forEach((trade: any) => {
        const day = new Date(trade.updatedAt).getDate();
        dailyPnl[day] = (dailyPnl[day] || 0) + (trade.pnl || 0);
    });

    return dailyPnl;
}

/**
 * Get correlation between checklist score and PnL
 */
export async function getDisciplineCorrelation() {
    const user = await getCurrentUser();

    const trades = await prisma.trade.findMany({
        where: {
            account: { userId: user.id },
            status: "CLOSED",
            checklistScore: { not: null },
            pnl: { not: null }
        },
        select: {
            checklistScore: true,
            pnl: true,
            symbol: true
        }
    });

    return trades.map((t: any) => ({
        score: t.checklistScore,
        pnl: t.pnl,
        symbol: t.symbol
    }));
}

/**
 * Fetch and normalize BTC price history as a benchmark
 */
export async function getBtcBenchmark() {
    try {
        const history = await getBalanceHistory();
        if (history.length === 0) return [];

        const startTime = new Date(history[0]!.timestamp).getTime();

        // Binance daily klines
        const symbol = "BTCUSDT";
        const interval = "1d";
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}`;

        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return [];

        const startPrice = parseFloat(data[0][4]); // Closing price of the first day
        const startingBalance = history[0]!.balance;

        // Map and normalize BTC price to account balance
        return data.map((d: any) => ({
            timestamp: new Date(d[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            benchmark: (parseFloat(d[4]) / startPrice) * startingBalance
        }));
    } catch (error) {
        console.error("BTC Benchmark fetch failed:", error);
        return [];
    }
}

/**
 * Get mood correlation (PnL by Mood)
 */
export async function getMoodCorrelation() {
    const trades = await prisma.trade.findMany({
        where: {
            status: "CLOSED",
        },
        select: {
            mood: true,
            pnl: true,
            id: true
        }
    });

    // Group by mood (filter out nulls in JS)
    const moodStats: Record<string, { count: number; pnl: number; winCount: number }> = {};

    trades.forEach((trade: any) => {
        const mood = trade.mood;
        if (!mood) return;

        if (!moodStats[mood]) {
            moodStats[mood] = { count: 0, pnl: 0, winCount: 0 };
        }

        const stats = moodStats[mood]!;
        stats.count++;
        stats.pnl += trade.pnl || 0;
        if ((trade.pnl || 0) > 0) {
            stats.winCount++;
        }
    });

    // Format for chart
    return Object.entries(moodStats).map(([mood, stats]) => ({
        mood,
        pnl: stats.pnl,
        winRate: (stats.winCount / stats.count) * 100,
        count: stats.count,
    })).sort((a, b) => b.pnl - a.pnl); // Sort by PnL
}
