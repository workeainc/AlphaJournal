import { describe, it, expect } from "vitest";
import { calculateRisk } from "./index";

describe("calculateRisk (Pro Trader Formula)", () => {
    it("should correctly calculate the User's Example Case", () => {
        // User Case: $5000 Balance, 1% Risk, Entry 2.17, SL 2.15
        const result = calculateRisk({
            accountBalance: 5000,
            riskPercentage: 1,
            entryPrice: 2.17,
            stopLossPrice: 2.15,
        });
        console.log("DEBUG RESULT:", result);

        expect(result.isValid).toBe(true);
        expect(result.riskAmount).toBe(50); // $50 Risk
        expect(result.riskPerContract).toBeCloseTo(0.02); // Distance
        expect(result.positionSize).toBe(2500); // 50 / 0.02 = 2500
        expect(result.notionalValue).toBe(5425); // 2500 * 2.17
        expect(result.leverageRequired).toBe(1.085); // 5425 / 5000
    });

    it("should handle Short Selling (Entry < SL)", () => {
        // Shorting ETH: Entry 3000, SL 3100
        const result = calculateRisk({
            accountBalance: 10000,
            riskPercentage: 1, // $100 Risk
            entryPrice: 3000,
            stopLossPrice: 3100, // 100 pts away
        });

        expect(result.riskAmount).toBe(100);
        expect(result.riskPerContract).toBe(100);
        expect(result.positionSize).toBe(1); // 100 / 100 = 1 ETH
    });

    it("should return error if Entry equals SL", () => {
        const result = calculateRisk({
            accountBalance: 1000,
            riskPercentage: 1,
            entryPrice: 100,
            stopLossPrice: 100,
        });

        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
    });
});
