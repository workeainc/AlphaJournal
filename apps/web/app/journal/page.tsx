import { getTrades } from "@/app/actions/trade";
import { JournalStats } from "@/components/JournalStats";
import { format } from "date-fns";
import { Calendar, Tag, ChevronRight, TrendingUp, TrendingDown, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function JournalPage() {
    const session = await auth();

    if (!session) {
        redirect("/api/auth/signin");
    }

    const trades = await getTrades();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                    Trade Journal
                </h1>
                <p className="text-slate-400 text-lg">
                    Review your performance and maintain trading discipline.
                </p>
            </header>

            <JournalStats trades={trades} />

            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Symbol</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Mood</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Direction</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Quality</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-300">PnL</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {trades.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">
                                        No trades logged yet. Start calculating!
                                    </td>
                                </tr>
                            ) : (
                                trades.map((trade: any) => (
                                    <tr key={trade.id} className="hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>{format(new Date(trade.createdAt), "MMM dd, HH:mm")}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-white tracking-wider group-hover:text-blue-400 transition-colors uppercase">
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
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trade.status === "OPEN" ? "bg-blue-500/10 text-blue-400" :
                                                trade.status === "CLOSED" ? "bg-slate-700 text-slate-300" :
                                                    "bg-orange-500/10 text-orange-400"
                                                }`}>
                                                {trade.status}
                                            </span>
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
                                            <Link
                                                href={`/journal/${trade.id}`}
                                                className="p-2 inline-flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
