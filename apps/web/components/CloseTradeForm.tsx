"use client";

import { useState } from "react";
import { closeTrade } from "@/app/actions/trade";
import { useRouter } from "next/navigation";
import { CheckCircle2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface CloseTradeFormProps {
    tradeId: string;
    entryPrice: number;
    quantity: number;
    direction: "LONG" | "SHORT";
}

export function CloseTradeForm({ tradeId, entryPrice, quantity, direction }: CloseTradeFormProps) {
    const [exitPrice, setExitPrice] = useState<number | "">("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const pnl = exitPrice !== ""
        ? (direction === "LONG" ? (Number(exitPrice) - entryPrice) * quantity : (entryPrice - Number(exitPrice)) * quantity)
        : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (exitPrice === "" || isLoading) return;

        setIsLoading(true);
        try {
            await closeTrade(tradeId, Number(exitPrice));
            router.refresh();
        } catch (error) {
            console.error("Failed to close trade:", error);
            alert("Failed to close trade. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Close Trade
            </h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Exit Price</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="number"
                            step="any"
                            required
                            value={exitPrice}
                            onChange={(e) => setExitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Enter actual exit price"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-white"
                        />
                    </div>
                </div>

                {pnl !== null && (
                    <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/50">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Estimated PnL</div>
                        <div className={`text-2xl font-mono font-bold flex items-center gap-2 ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {pnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            ${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={exitPrice === "" || isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isLoading ? "Closing..." : "Close Position"}</span>
                </button>
            </div>
        </form>
    );
}
