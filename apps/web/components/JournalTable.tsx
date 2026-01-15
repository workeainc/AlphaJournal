"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Calendar,
    ChevronRight,
    Trash2,
    Edit,
    CheckSquare,
    Square,
    MoreVertical,
    AlertTriangle,
    X,
    Check
} from "lucide-react";
import Link from "next/link";
import { deleteTrade, deleteTrades, updateTrade } from "@/app/actions/trade";
import { useRouter } from "next/navigation";

interface JournalTableProps {
    initialTrades: any[];
}

export function JournalTable({ initialTrades }: JournalTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingTrade, setEditingTrade] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const router = useRouter();

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === initialTrades.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(initialTrades.map(t => t.id));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this trade? This will also revert its impact on your balance.")) return;

        setIsDeleting(id);
        try {
            await deleteTrade(id);
            router.refresh();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete trade.");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} trades?`)) return;

        setIsBulkDeleting(true);
        try {
            await deleteTrades(selectedIds);
            setSelectedIds([]);
            router.refresh();
        } catch (error) {
            console.error("Bulk delete failed:", error);
            alert("Failed to delete trades.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTrade) return;

        try {
            await updateTrade(editingTrade.id, {
                symbol: editingTrade.symbol,
                mood: editingTrade.mood,
                notes: editingTrade.notes,
            });
            setEditingTrade(null);
            router.refresh();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update trade.");
        }
    };

    return (
        <div className="space-y-4">
            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-blue-400 font-bold">
                            {selectedIds.length} trades selected
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors border border-red-500/30 text-sm font-bold"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isBulkDeleting ? "Deleting..." : "Bulk Delete"}
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="px-6 py-4 w-12">
                                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-white transition-colors">
                                        {selectedIds.length === initialTrades.length && initialTrades.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-blue-400" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Symbol</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Mood</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Direction</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Quality</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">PnL</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {initialTrades.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">
                                        No trades logged yet. Start calculating!
                                    </td>
                                </tr>
                            ) : (
                                initialTrades.map((trade: any) => (
                                    <tr key={trade.id} className={`hover:bg-slate-800/20 transition-colors group ${selectedIds.includes(trade.id) ? 'bg-blue-500/5' : ''}`}>
                                        <td className="px-6 py-4 selection-cell">
                                            <button
                                                onClick={() => toggleSelect(trade.id)}
                                                className={`transition-colors ${selectedIds.includes(trade.id) ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}
                                            >
                                                {selectedIds.includes(trade.id) ? (
                                                    <CheckSquare className="w-5 h-5" />
                                                ) : (
                                                    <Square className="w-5 h-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>{format(new Date(trade.createdAt), "MMM dd, HH:mm")}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-white tracking-wider uppercase group-hover:text-blue-400 transition-colors">
                                                    {trade.symbol}
                                                </span>
                                                <div className="flex flex-wrap gap-1 empty:hidden">
                                                    {trade.tags?.map((tag: any) => (
                                                        <span
                                                            key={tag.id}
                                                            className="text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded tracking-tighter"
                                                        >
                                                            #{tag.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                {/* Targets Display (Phase 7) */}
                                                {trade.targets && trade.targets.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {trade.targets.map((t: any, i: number) => (
                                                            <span
                                                                key={t.id}
                                                                className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded"
                                                                title={`${t.percentage}% Quantity`}
                                                            >
                                                                TP{i + 1} ${t.price}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {trade.mood ? (
                                                <div className="flex items-center gap-2" title={trade.mood}>
                                                    <span className="text-xl">
                                                        {trade.mood === "CALM" ? "🧘" :
                                                            trade.mood === "EXCITED" ? "🤩" :
                                                                trade.mood === "TIRED" ? "😴" :
                                                                    trade.mood === "FRUSTRATED" ? "😤" :
                                                                        trade.mood === "ANGRY" ? "🤬" :
                                                                            trade.mood === "REVENGE" ? "🔥" : "❔"}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{trade.mood}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${trade.direction === "LONG"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                }`}>
                                                {trade.direction}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${trade.checklistScore! >= 80 ? "bg-emerald-500" :
                                                            trade.checklistScore! >= 60 ? "bg-blue-500" :
                                                                "bg-red-500"
                                                            }`}
                                                        style={{ width: `${trade.checklistScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-slate-300">
                                                    {trade.checklistScore}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {trade.pnl !== null ? (
                                                <span className={`font-bold ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 italic">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingTrade(trade)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                                                    title="Edit Trade"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trade.id)}
                                                    disabled={isDeleting === trade.id}
                                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Delete Trade"
                                                >
                                                    <Trash2 className={`w-4 h-4 ${isDeleting === trade.id ? 'animate-pulse' : ''}`} />
                                                </button>
                                                <Link
                                                    href={`/journal/${trade.id}`}
                                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                                    title="View Details"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingTrade && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">Edit Trade</h3>
                            <button onClick={() => setEditingTrade(null)} className="text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Symbol</label>
                                <input
                                    type="text"
                                    value={editingTrade.symbol}
                                    onChange={e => setEditingTrade({ ...editingTrade, symbol: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Mood</label>
                                <select
                                    value={editingTrade.mood || ""}
                                    onChange={e => setEditingTrade({ ...editingTrade, mood: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                >
                                    <option value="">Select Mood</option>
                                    <option value="CALM">🧘 Calm</option>
                                    <option value="EXCITED">🤩 Excited</option>
                                    <option value="TIRED">😴 Tired</option>
                                    <option value="FRUSTRATED">😤 Frustrated</option>
                                    <option value="ANGRY">🤬 Angry</option>
                                    <option value="REVENGE">🔥 Revenge</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                                <textarea
                                    value={editingTrade.notes || ""}
                                    onChange={e => setEditingTrade({ ...editingTrade, notes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white h-32 focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingTrade(null)}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
