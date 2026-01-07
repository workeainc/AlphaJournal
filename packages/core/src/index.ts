export interface RiskParams {
    accountBalance: number;
    riskPercentage: number; // e.g., 2 for 2%
    entryPrice: number;
    stopLossPrice: number;
    targetPrice?: number; // Optional, for R:R calculation
}

export interface TradeCalculation {
    riskAmount: number; // The dollar amount risked (1R)
    riskPerContract: number; // The distance per unit
    positionSize: number; // Number of contracts/units
    notionalValue: number; // Total value of the position
    leverageRequired: number; // Leverage needed
    rewardToRisk?: number; // R:R Ratio
    isValid: boolean;
    error?: string;
}

/**
 * Calculates the position size and risk metrics based on the Pro Trader formula:
 * Quantity = (TotalRisk) / (Entry - SL Distance)
 */
export function calculateRisk(params: RiskParams): TradeCalculation {
    const { accountBalance, riskPercentage, entryPrice, stopLossPrice, targetPrice } = params;

    // 1. Basic Validation
    if (entryPrice <= 0 || stopLossPrice <= 0 || accountBalance <= 0) {
        return {
            riskAmount: 0,
            riskPerContract: 0,
            positionSize: 0,
            notionalValue: 0,
            leverageRequired: 0,
            isValid: false,
            error: "Prices and Balance must be positive",
        };
    }

    // 2. Calculate Risk Amount (The "Tuition Fee")
    const riskAmount = accountBalance * (riskPercentage / 100);

    // 3. Calculate Risk Per Contract (Distance)
    // We use Math.abs and fix floating point precision to 8 decimal places to avoid 0.020000000000000018
    const rawDistance = Math.abs(entryPrice - stopLossPrice);
    const riskPerContract = Number(rawDistance.toFixed(8));

    if (riskPerContract === 0) {
        return {
            riskAmount,
            riskPerContract: 0,
            positionSize: 0,
            notionalValue: 0,
            leverageRequired: 0,
            isValid: false,
            error: "Stop Loss cannot be equal to Entry Price",
        };
    }

    // 4. Calculate Position Size (The Formula)
    const positionSize = riskAmount / riskPerContract;

    // 5. Calculate Notional Value (Total Deal Size)
    const notionalValue = positionSize * entryPrice;

    // 6. Calculate Leverage (Notional / Balance)
    const leverageRequired = notionalValue / accountBalance;

    // 7. Calculate R:R (if Target is provided)
    let rewardToRisk = undefined;
    if (targetPrice) {
        const rewardPerContract = Math.abs(targetPrice - entryPrice);
        rewardToRisk = rewardPerContract / riskPerContract;
    }

    return {
        riskAmount,
        riskPerContract,
        positionSize,
        notionalValue,
        leverageRequired,
        rewardToRisk,
        isValid: true,
    };
}

// Export checklist utilities
export * from './checklist';
