"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { calculateRisk, type TradeCalculation, type ChecklistItem } from "@repo/core";
import { Calculator, ShieldCheck, DollarSign, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";
import { LogTradeModal } from "../components/LogTradeModal";
import { getDefaultChecklist } from "./actions/checklist";
import { getCurrentUser } from "./actions/user";

export default function Home() {
  const { data: session, status } = useSession();

  // --- State ---
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entry, setEntry] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [target, setTarget] = useState<number>(0); // Optional

  const [result, setResult] = useState<TradeCalculation | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // Load user profile defaults if logged in
  useEffect(() => {
    if (status === "authenticated") {
      getCurrentUser().then(user => {
        setBalance(user.initialBalance);
        setRiskPercent(user.riskTolerance);
      }).catch(console.error);
    }
  }, [status]);

  // --- Effect: Auto Calculate on Input Change ---
  useEffect(() => {
    if (balance > 0 && entry > 0 && stopLoss > 0) {
      const calc = calculateRisk({
        accountBalance: balance,
        riskPercentage: riskPercent,
        entryPrice: entry,
        stopLossPrice: stopLoss,
        targetPrice: target > 0 ? target : undefined,
      });
      setResult(calc);
    } else {
      setResult(null);
    }
  }, [balance, riskPercent, entry, stopLoss, target]);

  // Load checklist items when modal opens
  const handleOpenModal = async () => {
    if (status !== "authenticated") {
      signIn();
      return;
    }

    try {
      const checklist = await getDefaultChecklist();
      setChecklistItems(
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
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to load checklist:", error);
      alert("Failed to load checklist. Please refresh the page.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center space-x-3 border-b border-slate-800 pb-6">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Alpha Journal
            </h1>
            <p className="text-slate-400 text-sm">Professional Risk Manager</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Inputs */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-6 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Risk Parameters
              </h2>

              <div className="space-y-5">
                {/* Account Balance */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Account Balance (USDT)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-lg"
                    />
                  </div>
                </div>

                {/* Risk % */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Risk per Trade (%)</label>
                  <div className="flex space-x-2">
                    {[0.5, 1, 2, 5].map((p) => (
                      <button
                        key={p}
                        onClick={() => setRiskPercent(p)}
                        className={`flex-1 py-1 text-sm rounded-md border transition-all ${riskPercent === p
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                          }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="range" min="0.1" max="10" step="0.1"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                    className="w-full mt-3 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-xs text-blue-400 mt-1 font-mono font-bold">
                    Risking ${(balance * (riskPercent / 100)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-6 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trade Setup
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Entry Price</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={entry || ""}
                      onChange={(e) => setEntry(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Stop Loss</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={stopLoss || ""}
                      onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-red-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={target || ""}
                    onChange={(e) => setTarget(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-emerald-200"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Results (The HUD) */}
          <section className="lg:col-span-7">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-slate-600 border border-slate-800/50 border-dashed rounded-3xl bg-slate-900/20">
                <Calculator className="w-12 h-12 mb-4 opacity-50" />
                <p>Enter trade details to calculate position size.</p>
              </div>
            ) : !result.isValid ? (
              <div className="p-6 bg-red-900/20 border border-red-900/50 rounded-2xl text-red-200 flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-bold">Invalid Setup</h3>
                  <p className="text-sm opacity-80">{result.error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">

                {/* HERO CARD */}
                <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 shadow-2xl shadow-blue-900/30 overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                  <div className="relative z-10">
                    <h3 className="text-blue-200 font-medium text-sm uppercase tracking-wide mb-1">Position Size</h3>
                    <div className="text-5xl font-bold text-white font-mono tracking-tighter">
                      {result.positionSize.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      <span className="text-xl text-blue-300 ml-2 font-sans font-normal">Units</span>
                    </div>
                    <div className="mt-6 flex items-center space-x-6">
                      <div>
                        <p className="text-blue-300 text-xs uppercase font-bold">Total Value</p>
                        <p className="text-xl font-mono text-white">${result.notionalValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase font-bold">Leverage</p>
                        <p className="text-xl font-mono text-white">{result.leverageRequired.toFixed(2)}x</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* METRICS GRID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-2">Distance (Risk Width)</p>
                    <p className="text-2xl font-mono text-slate-200">{result.riskPerContract.toFixed(6)}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-slate-500 text-xs uppercase font-bold mb-2">Risk amount (1R)</p>
                    <p className="text-2xl font-mono text-red-400">-${result.riskAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* R:R METRIC */}
                {result.rewardToRisk && (
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs uppercase font-bold mb-1">Reward to Risk</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-mono text-emerald-400 font-bold">
                          {result.rewardToRisk.toFixed(2)}R
                        </span>
                        <span className="text-sm text-slate-400">
                          (TP: +${(result.riskAmount * result.rewardToRisk).toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${result.rewardToRisk >= 3 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" :
                      result.rewardToRisk >= 2 ? "bg-blue-500/20 text-blue-400 border-blue-500/50" :
                        "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                      }`}>
                      {result.rewardToRisk >= 3 ? "EXCELLENT" : result.rewardToRisk >= 2 ? "GOOD" : "AGRESSIVE"}
                    </div>
                  </div>
                )}

                {/* LOG TRADE BUTTON */}
                <button
                  onClick={handleOpenModal}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center space-x-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Log Trade to Journal</span>
                </button>

              </div>
            )}
          </section>

        </div>
      </div>

      {/* Log Trade Modal */}
      {result?.isValid && (
        <LogTradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          calculation={result}
          entryPrice={entry}
          stopLoss={stopLoss}
          targetPrice={target > 0 ? target : undefined}
          checklistItems={checklistItems}
        />
      )}
    </main>
  );
}
