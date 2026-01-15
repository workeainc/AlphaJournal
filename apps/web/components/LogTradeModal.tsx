"use client";

import { useState, useEffect, useCallback } from "react";
import { X, TrendingUp, TrendingDown, Loader2, CheckCircle, Tag as TagIcon } from "lucide-react";
import type { TradeCalculation, ChecklistItem, ChecklistResponse, QualityScoreResult } from "@repo/core";
import { PreTradeChecklist } from "./PreTradeChecklist";
import { createTrade } from "../app/actions/trade";

interface LogTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    calculation: TradeCalculation;
    entryPrice: number;
    stopLoss: number;
    targetPrice?: number;
    checklistItems: ChecklistItem[];
    targets?: Array<{ id: string; price: number; percentage: number }>;
}

export function LogTradeModal({
    isOpen,
    onClose,
    calculation,
    entryPrice,
    stopLoss,
    targetPrice,
    checklistItems,
    targets = [],
}: LogTradeModalProps) {
    const [symbol, setSymbol] = useState("");
    const [notes, setNotes] = useState("");
    const [tradingViewLink, setTradingViewLink] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse[]>([]);
    const [qualityScore, setQualityScore] = useState<QualityScoreResult | null>(null);
    const [mood, setMood] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Auto-detect direction
    const direction: "LONG" | "SHORT" = entryPrice > stopLoss ? "LONG" : "SHORT";

    useEffect(() => {
        if (isOpen) {
            setSymbol("");
            setTradingViewLink("");
            setTags([]);
            setTagInput("");
            setMood("");
            setChecklistResponses([]);
            setQualityScore(null);
            setIsSuccess(false);

            // Pre-fill notes with TP breakdown if targets exist
            if (targets.length > 0) {
                const tpNotes = targets.map((t, i) =>
                    `TP${i + 1}: ${t.price} (${t.percentage}%)`
                ).join('\n');
                setNotes(`Start Plan:\n${tpNotes}\n\n`);
            } else {
                setNotes("");
            }
        }
    }, [isOpen, targets]);

    const MOODS = [
        { id: "CALM", label: "Calm", emoji: "🧘" },
        { id: "EXCITED", label: "Excited", emoji: "🤩" },
        { id: "TIRED", label: "Tired", emoji: "😴" },
        { id: "FRUSTRATED", label: "Frustrated", emoji: "😤" },
        { id: "ANGRY", label: "Angry", emoji: "🤬" },
        { id: "REVENGE", label: "Revenge", emoji: "🔥" },
    ];

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = tagInput.trim().toUpperCase().replace(/^#/, '');
            if (tag && !tags.includes(tag)) {
                setTags([...tags, tag]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleChecklistChange = useCallback((responses: ChecklistResponse[], score: QualityScoreResult) => {
        setChecklistResponses(responses);
        setQualityScore(score);
    }, []);

    const handleSubmit = async () => {
        if (!symbol.trim()) {
            alert("Please enter a symbol");
            return;
        }

        if (!qualityScore?.isPassing) {
            alert("Please complete all required checklist items");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createTrade({
                symbol: symbol.trim(),
                direction,
                entryPrice,
                stopLoss,
                targetPrice,
                quantity: calculation.positionSize,
                riskAmount: calculation.riskAmount,
                checklistResponses,
                notes: notes.trim() || undefined,
                tradingViewLink: tradingViewLink.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
                mood: mood || undefined,
            });

            console.log("Trade created:", result);
            setIsSuccess(true);

            // Close modal after 2 seconds
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Failed to create trade:", error);
            alert(error instanceof Error ? error.message : "Failed to create trade");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Log Trade to Journal</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Complete the checklist to commit this trade
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Trade Logged!</h3>
                            <p className="text-slate-400">
                                Quality Score: <span className="text-emerald-400 font-bold">{qualityScore?.score}%</span>
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Trade Setup Summary */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">
                                    Trade Setup
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Direction</p>
                                        <div className="flex items-center space-x-2">
                                            {direction === "LONG" ? (
                                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 text-red-400" />
                                            )}
                                            <span className={`font-bold ${direction === "LONG" ? "text-emerald-400" : "text-red-400"}`}>
                                                {direction}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Position Size</p>
                                        <p className="font-mono text-white">
                                            {calculation.positionSize.toLocaleString(undefined, { maximumFractionDigits: 4 })} units
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Risk Amount</p>
                                        <p className="font-mono text-red-400">
                                            ${calculation.riskAmount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">R:R Ratio</p>
                                        <p className="font-mono text-emerald-400">
                                            {calculation.rewardToRisk ? `${calculation.rewardToRisk.toFixed(2)}R` : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Symbol Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Symbol <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="e.g., BTCUSDT"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-mono text-lg"
                                />
                            </div>

                            {/* Mood Selector (New Phase 21) */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-4">
                                    Current Mood <span className="text-slate-500 text-xs ml-2">(How are you feeling?)</span>
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {MOODS.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMood(m.id)}
                                            className={`
                                                flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                                                ${mood === m.id
                                                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800"
                                                }
                                            `}
                                        >
                                            <span className="text-2xl mb-1">{m.emoji}</span>
                                            <span className="text-xs font-bold">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pre-Trade Checklist */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-4">
                                    Pre-Trade Checklist <span className="text-red-400">*</span>
                                </h3>
                                <PreTradeChecklist
                                    items={checklistItems}
                                    onChange={handleChecklistChange}
                                />
                            </div>

                            {/* Tagging Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <TagIcon className="w-4 h-4 text-slate-500" />
                                    Tags (Optional)
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Strategy tags (Type and press Enter or Comma)..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold"
                                            >
                                                #{tag}
                                                <button
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-white transition-colors font-bold ml-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Optional Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        TradingView Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={tradingViewLink}
                                        onChange={(e) => setTradingViewLink(e.target.value)}
                                        placeholder="https://tradingview.com/..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Any additional thoughts or observations..."
                                        rows={3}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white resize-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isSuccess && (
                    <div className="p-6 border-t border-slate-800 flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!symbol.trim() || !qualityScore?.isPassing || isSubmitting}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded-lg transition-all flex items-center space-x-2 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Committing...</span>
                                </>
                            ) : (
                                <span>Commit to Journal</span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
