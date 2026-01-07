"use client";

import {
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    ComposedChart,
    PieChart,
    Pie
} from "recharts";
import { Brain, Info } from "lucide-react";

interface MoodStat {
    mood: string;
    pnl: number;
    winRate: number;
    count: number;
    [key: string]: any;
}

interface MoodAnalysisProps {
    data: MoodStat[];
}

const MOOD_EMOJIS: Record<string, string> = {
    "CALM": "🧘",
    "EXCITED": "🤩",
    "TIRED": "😴",
    "FRUSTRATED": "😤",
    "ANGRY": "🤬",
    "REVENGE": "🔥",
};

const MOOD_COLORS: Record<string, string> = {
    "CALM": "#3b82f6",     // Blue
    "EXCITED": "#f59e0b",  // Amber
    "TIRED": "#6366f1",    // Indigo
    "FRUSTRATED": "#ec4899", // Pink
    "ANGRY": "#ef4444",    // Red
    "REVENGE": "#7c3aed",  // Violet
};

export function MoodAnalysis({ data }: MoodAnalysisProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                <Brain className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">No psychology data yet.</p>
                <p className="text-sm opacity-60">Log your mood with your next trade!</p>
            </div>
        );
    }

    const totalTrades = data.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Mood Distribution */}
                <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        Mood Frequency
                    </h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="mood"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood] || "#334155"} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        borderColor: "#1e293b",
                                        borderRadius: "12px",
                                        border: "none",
                                        color: "#fff"
                                    }}
                                    itemStyle={{ color: "#fff" }}
                                    formatter={(value: any, name: string | undefined) => [`${value} trades`, name || ""]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white">{totalTrades}</span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total</span>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {data.map((stat) => (
                            <div key={stat.mood} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MOOD_COLORS[stat.mood] }} />
                                    <span className="text-slate-400 font-medium">{MOOD_EMOJIS[stat.mood]} {stat.mood}</span>
                                </div>
                                <span className="text-slate-500 font-mono">
                                    {((stat.count / totalTrades) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Chart (PnL) */}
                <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-pink-400" />
                        Profit/Loss by State
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={data}
                                margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                            >
                                <defs>
                                    <linearGradient id="positivePnL" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                                    </linearGradient>
                                    <linearGradient id="negativePnL" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="mood"
                                    tickFormatter={(mood) => MOOD_EMOJIS[mood] || mood}
                                    stroke="#64748b"
                                    fontSize={14}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#64748b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.3 }}
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        borderColor: "#1e293b",
                                        borderRadius: "16px",
                                        padding: "12px",
                                        border: "none"
                                    }}
                                    formatter={(value: any, name: string | undefined) => {
                                        if (name === "pnl") return [`$${value.toLocaleString()}`, "PnL"];
                                        return [value, name || ""];
                                    }}
                                />
                                <ReferenceLine yAxisId="left" y={0} stroke="#475569" strokeDasharray="3 3" />
                                <Bar
                                    yAxisId="left"
                                    dataKey="pnl"
                                    barSize={40}
                                    radius={[4, 4, 0, 0]}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.pnl >= 0 ? "url(#positivePnL)" : "url(#negativePnL)"}
                                        />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Stat Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.map((stat) => (
                    <div
                        key={stat.mood}
                        className="group bg-slate-900/40 border border-slate-800 rounded-2xl p-4 hover:border-slate-600 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{MOOD_EMOJIS[stat.mood]}</span>
                            <span className="text-[10px] font-black uppercase text-slate-500">{stat.mood}</span>
                        </div>
                        <div className={`text-lg font-mono font-bold ${stat.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {stat.pnl >= 0 ? "+" : ""}${Math.abs(stat.pnl).toLocaleString()}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500">WIN RATE</span>
                            <span className={stat.winRate >= 50 ? "text-blue-400" : "text-slate-400"}>
                                {stat.winRate.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${stat.winRate >= 50 ? "bg-blue-500" : "bg-slate-600"}`}
                                style={{ width: `${stat.winRate}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
