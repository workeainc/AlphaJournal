"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { calculateRisk, type TradeCalculation, type ChecklistItem } from "@repo/core";
import { Calculator, ShieldCheck, DollarSign, TrendingUp, AlertTriangle, BookOpen, Plus, Trash2 } from "lucide-react";
import { LogTradeModal } from "../components/LogTradeModal";
import { getDefaultChecklist } from "./actions/checklist";
import { getCurrentUser } from "./actions/user";

interface Target {
  id: string;
  price: number;
  percentage: number; // 0-100
}

export default function Home() {
  const { data: session, status } = useSession();

  // --- State ---
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entry, setEntry] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);

  // Multi-Target State
  const [targets, setTargets] = useState<Target[]>([]);

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
      // Basic calculation
      const calc = calculateRisk({
        accountBalance: balance,
        riskPercentage: riskPercent,
        entryPrice: entry,
        stopLossPrice: stopLoss,
        targetPrice: targets.length === 1 ? targets[0].price : undefined, // Legacy support for 1 TP
      });

      // augment with weighted R:R if multiple targets
      if (targets.length > 0 && calc.isValid) {
        const riskDist = Math.abs(entry - stopLoss);
        if (riskDist > 0) {
          let totalWeightedR = 0;
          let totalPercent = 0;

          targets.forEach(t => {
            const rewardDist = Math.abs(t.price - entry);
            const rMultiple = rewardDist / riskDist;
            totalWeightedR += rMultiple * (t.percentage / 100);
            totalPercent += t.percentage;
          });

          // If targets don't sum to 100%, assume remainder is closed at 0 or held? 
          // For R:R display, we usually want "Potential R:R" if all TPs hit.
          // Let's normalize to the covered percentage for display/planning.
          if (totalPercent > 0) {
            calc.rewardToRisk = totalWeightedR; // Show weighted average
          }
        }
      }

      setResult(calc);
    } else {
      setResult(null);
    }
  }, [balance, riskPercent, entry, stopLoss, targets]);

  // Multi-Target Handlers
  const addTarget = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    // Auto-calculate next target price (e.g., +2R)
    let nextPrice = 0;
    if (entry > 0 && stopLoss > 0) {
      const risk = Math.abs(entry - stopLoss);
      const direction = entry > stopLoss ? 1 : -1;
      // If no targets, set 2R. If existing, add another 1R to the last one
      if (targets.length === 0) {
        nextPrice = entry + (risk * 2 * direction);
      } else {
        const last = targets[targets.length - 1];
        nextPrice = last.price + (risk * direction);
      }
    }

    // Auto-distribute percentage
    const currentTotal = targets.reduce((sum, t) => sum + t.percentage, 0);
    const remaining = Math.max(0, 100 - currentTotal);

    setTargets([...targets, { id: newId, price: nextPrice || 0, percentage: remaining }]);
  };

  const removeTarget = (id: string) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  const updateTarget = (id: string, field: 'price' | 'percentage', value: number) => {
    setTargets(targets.map(t => t.id === id ? { ...t, [field]: value } : t));
  };


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
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-center font-bold text-white"
                    />
                    <span className="text-slate-500">%</span>
                  </div>

                  <div className="flex space-x-2">
                    {[0.5, 1, 2, 5].map((p) => (
                      <button
                        key={p}
                        onClick={() => setRiskPercent(p)}
                        className={`flex-1 py-1 text-xs rounded-md border transition-all ${riskPercent === p
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                          }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="range" min="0.1" max="5" step="0.1"
                    value={riskPercent > 5 ? 5 : riskPercent}
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

                {/* Multi-Target Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-slate-400">Take Profit Targets</label>
                    <button onClick={addTarget} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold">
                      <Plus className="w-3 h-3" /> Add TP
                    </button>
                  </div>

                  <div className="space-y-2">
                    {targets.length === 0 && (
                      <div className="text-xs text-slate-600 italic text-center py-2 border border-slate-800 border-dashed rounded">
                        No targets set. Open-ended trade.
                      </div>
                    )}
                    {targets.map((t, i) => {
                      // Dynamic R Calc
                      let rMult = 0;
                      if (entry > 0 && stopLoss > 0 && t.price > 0) {
                        const risk = Math.abs(entry - stopLoss);
                        const reward = Math.abs(t.price - entry);
                        if (risk > 0) rMult = reward / risk;
                      }

                      return (
                        <div key={t.id} className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in duration-200">
                          <span className="text-xs font-mono text-slate-500 w-6">TP{i + 1}</span>
                          <input
                            type="number"
                            value={t.price || ""}
                            onChange={(e) => updateTarget(t.id, 'price', parseFloat(e.target.value))}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded py-1 px-2 text-xs font-mono text-emerald-300 focus:border-emerald-500/50 outline-none"
                            placeholder="Price"
                          />
                          <div className="relative w-20 shrink-0">
                            <input
                              type="number"
                              value={t.percentage || ""}
                              onChange={(e) => updateTarget(t.id, 'percentage', parseFloat(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-2 text-xs font-mono text-white focus:border-blue-500/50 outline-none text-right pr-4"
                              placeholder="%"
                            />
                            <span className="absolute right-1 top-1 text-[10px] text-slate-500">%</span>
                          </div>
                          <div className="w-12 text-right shrink-0">
                            <span className="text-[10px] font-mono text-emerald-500 font-bold">
                              {rMult > 0 ? `+${rMult.toFixed(1)}R` : '-'}
                            </span>
                          </div>
                          <button
                            onClick={() => removeTarget(t.id)}
                            className="text-slate-600 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {/* Total Sizing Check */}
                  {targets.length > 0 && (
                    <div className="mt-2 text-right text-[10px]">
                      <span className={
                        targets.reduce((s, t) => s + t.percentage, 0) === 100
                          ? "text-emerald-500"
                          : "text-orange-400"
                      }>
                        Total Exit: {targets.reduce((s, t) => s + t.percentage, 0)}%
                      </span>
                    </div>
                  )}
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
                      <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                        {targets.length > 1 ? "Weighted R:R" : "Reward to Risk"}
                      </p>
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
          // Pass the FIRST target as "targetPrice" for database compatibility (Phase 1)
          targetPrice={targets.length > 0 ? targets[0].price : undefined}
          // Pass full targets array via special prop (requires Modal update)
          targets={targets}
          checklistItems={checklistItems}
        />
      )}
    </main>
  );
}
