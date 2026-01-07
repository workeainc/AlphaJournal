import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

interface JournalStats {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgQualityScore: number;
}

export function JournalStats({ trades }: { trades: any[] }) {
    const stats: JournalStats = {
        totalTrades: trades.length,
        winRate: trades.length > 0
            ? (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100
            : 0,
        totalPnL: trades.reduce((acc, t) => acc + (t.pnl || 0), 0),
        avgQualityScore: trades.length > 0
            ? trades.reduce((acc, t) => acc + (t.checklistScore || 0), 0) / trades.length
            : 0,
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
                label="Total Trades"
                value={stats.totalTrades.toString()}
                icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
            />
            <StatCard
                label="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                icon={<Target className="w-5 h-5 text-emerald-400" />}
                trend={stats.winRate >= 50 ? "up" : "down"}
            />
            <StatCard
                label="Total PnL"
                value={`$${stats.totalPnL.toLocaleString()}`}
                icon={stats.totalPnL >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                trend={stats.totalPnL >= 0 ? "up" : "down"}
            />
            <StatCard
                label="Avg Quality"
                value={`${stats.avgQualityScore.toFixed(0)}%`}
                icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
            />
        </div>
    );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: "up" | "down" }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">{label}</span>
                {icon}
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-white">{value}</span>
                {trend && (
                    <span className={`text-xs font-medium ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                        {trend === "up" ? "▲ Good" : "▼ Review"}
                    </span>
                )}
            </div>
        </div>
    );
}
