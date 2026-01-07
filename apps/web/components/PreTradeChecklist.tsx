"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { ChecklistItem as ChecklistItemType, ChecklistResponse, QualityScoreResult } from "@repo/core";
import { calculateQualityScore } from "@repo/core";

interface PreTradeChecklistProps {
    items: ChecklistItemType[];
    onChange: (responses: ChecklistResponse[], score: QualityScoreResult) => void;
}

export function PreTradeChecklist({ items, onChange }: PreTradeChecklistProps) {
    const [responses, setResponses] = useState<Map<string, string>>(new Map());

    // Calculate score whenever responses change
    useEffect(() => {
        const responseArray: ChecklistResponse[] = Array.from(responses.entries()).map(
            ([itemId, value]) => ({ itemId, value })
        );

        const score = calculateQualityScore(responseArray, items);
        onChange(responseArray, score);
    }, [responses, items, onChange]);

    const handleResponseChange = (itemId: string, value: string) => {
        setResponses((prev) => {
            const next = new Map(prev);
            next.set(itemId, value);
            return next;
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-blue-400";
        if (score >= 40) return "text-yellow-400";
        return "text-red-400";
    };

    const currentScore = calculateQualityScore(
        Array.from(responses.entries()).map(([itemId, value]) => ({ itemId, value })),
        items
    );

    return (
        <div className="space-y-6">
            {/* Score Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                            Quality Score
                        </p>
                        <div className="flex items-baseline space-x-2">
                            <span className={`text-3xl font-mono font-bold ${getScoreColor(currentScore.score)}`}>
                                {currentScore.score}%
                            </span>
                            <span className="text-sm text-slate-400">
                                ({currentScore.passedItems}/{currentScore.totalItems} passed)
                            </span>
                        </div>
                    </div>
                    {currentScore.isPassing ? (
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                            PASSING
                        </div>
                    ) : (
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50">
                            NEEDS WORK
                        </div>
                    )}
                </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-4">
                {items.map((item) => {
                    const hasResponse = responses.has(item.id);
                    const response = responses.get(item.id);
                    const options = item.options || [];

                    return (
                        <div
                            key={item.id}
                            className={`border rounded-xl p-4 transition-all ${hasResponse
                                    ? "border-blue-500/50 bg-blue-500/5"
                                    : "border-slate-800 bg-slate-900/50"
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="mt-0.5">
                                    {hasResponse ? (
                                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-slate-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-semibold text-slate-200">
                                            {item.label}
                                        </h4>
                                        {item.required && (
                                            <span className="text-xs text-red-400">*</span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-slate-400 mb-3">
                                            {item.description}
                                        </p>
                                    )}

                                    {/* Response Options */}
                                    {item.type === "YES_NO" && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleResponseChange(item.id, "YES")}
                                                className={`flex-1 py-2 px-4 rounded-lg border transition-all text-sm font-medium ${response === "YES"
                                                        ? "bg-emerald-600 border-emerald-500 text-white"
                                                        : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                                                    }`}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={() => handleResponseChange(item.id, "NO")}
                                                className={`flex-1 py-2 px-4 rounded-lg border transition-all text-sm font-medium ${response === "NO"
                                                        ? "bg-red-600 border-red-500 text-white"
                                                        : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                                                    }`}
                                            >
                                                No
                                            </button>
                                        </div>
                                    )}

                                    {item.type === "MULTIPLE_CHOICE" && (
                                        <div className="flex flex-wrap gap-2">
                                            {options.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => handleResponseChange(item.id, option)}
                                                    className={`py-2 px-4 rounded-lg border transition-all text-sm font-medium ${response === option
                                                            ? "bg-blue-600 border-blue-500 text-white"
                                                            : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                                                        }`}
                                                >
                                                    {option.replace(/_/g, " ")}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {item.type === "TEXT" && (
                                        <input
                                            type="text"
                                            value={response || ""}
                                            onChange={(e) => handleResponseChange(item.id, e.target.value)}
                                            placeholder="Enter your response..."
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Warning if not passing */}
            {!currentScore.isPassing && currentScore.score > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-xl text-yellow-200">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Quality Score Below 60%</p>
                        <p className="text-yellow-300/80">
                            Consider reviewing your setup. Professional traders aim for 80%+ quality scores.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
