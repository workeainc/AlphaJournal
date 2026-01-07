import { getBalanceHistory, getPerformanceStats, getDisciplineCorrelation, getMoodCorrelation } from "@/app/actions/portfolio";
import { MoodAnalysis } from "@/components/MoodAnalysis";
import { EquityChart } from "@/components/EquityChart";
import { PnlCalendar } from "@/components/PnlCalendar";
import { DisciplineChart } from "@/components/DisciplineChart";
import { TrendingUp, TrendingDown, Award, BarChart3, PieChart, Activity, ShieldAlert, Zap, Target, Brain } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PortfolioPage() {
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const history = await getBalanceHistory();
    const stats = await getPerformanceStats();
    const correlationData = await getDisciplineCorrelation();
    const moodStats = await getMoodCorrelation();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                    <PieChart className="w-8 h-8 text-blue-500" />
                    Portfolio Analytics
                </h1>
                <p className="text-slate-400 mt-2">Track your equity growth and performance metrics.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Equity Chart Card */}
                <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                Equity Curve
                            </h2>
                            <p className="text-slate-500 text-sm">Account balance over time</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase font-bold">Current Balance</div>
                            <div className="text-2xl font-mono font-bold text-white">
                                ${history[history.length - 1]?.balance.toLocaleString() || "0"}
                            </div>
                        </div>
                    </div>

                    <EquityChart data={history} />
                </div>

                {/* Key Metrics Side Grid */}
                <div className="lg:col-span-4 grid grid-cols-1 gap-6">
                    <StatCard
                        label="Win Rate"
                        value={`${stats.winRate.toFixed(1)}%`}
                        subValue={`${stats.winningTrades} Wins / ${stats.losingTrades} Losses`}
                        icon={<Award className="w-5 h-5 text-yellow-500" />}
                    />
                    <StatCard
                        label="Profit Factor"
                        value={stats.profitFactor.toFixed(2)}
                        subValue="Gross Win / Gross Loss"
                        icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
                        highlight={stats.profitFactor >= 1.5 ? "text-emerald-400" : stats.profitFactor >= 1.0 ? "text-blue-400" : "text-red-400"}
                    />
                    <StatCard
                        label="Total Realized PnL"
                        value={`$${stats.totalPnL.toLocaleString()}`}
                        subValue="Cumulative profit & loss"
                        icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                        highlight={stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}
                    />
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <MetricBox label="Avg Quality Score" value={`${stats.avgQuality.toFixed(0)}%`} />
                <MetricBox label="Winning Trades" value={stats.winningTrades.toString()} highlight="text-emerald-400" />
                <MetricBox label="Losing Trades" value={stats.losingTrades.toString()} highlight="text-red-400" />
                <MetricBox label="Total Positions" value={stats.totalTrades.toString()} />
            </div>

            {/* Performance Insights Metrics */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-blue-400" />
                    Performance Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label="Avg. Trade Value"
                        value={`$${stats.expectancy.toFixed(2)}`}
                        subValue="What you make on an average trade"
                        icon={<Zap className="w-5 h-5 text-blue-500" />}
                    />
                    <StatCard
                        label="Max Drawdown"
                        value={`${stats.maxDrawdown.toFixed(2)}%`}
                        subValue="Largest percentage drop in capital"
                        icon={<TrendingDown className="w-5 h-5 text-red-500" />}
                        highlight="text-red-400"
                    />
                    <StatCard
                        label="Execution Quality"
                        value={`${stats.avgRRRealization.toFixed(1)}%`}
                        subValue="How much of planned profit you capture"
                        icon={<Target className="w-5 h-5 text-emerald-500" />}
                        highlight={stats.avgRRRealization >= 80 ? "text-emerald-400" : stats.avgRRRealization >= 50 ? "text-yellow-400" : "text-red-400"}
                    />
                </div>
            </div>

            {/* Discipline Impact Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            Discipline Impact
                        </h2>
                        <p className="text-slate-500 text-sm">See if following your rules actually leads to more profit</p>
                    </div>
                </div>

                {correlationData.length > 0 ? (
                    <DisciplineChart data={correlationData} />
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                        N/A - Close more trades to see correlation
                    </div>
                )}
            </div>

            {/* Tilt & Mood Tracking (Phase 21) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Brain className="w-5 h-5 text-pink-400" />
                            Tilt & Mood Tracking
                        </h2>
                        <p className="text-slate-500 text-sm">Discover your most expensive emotions</p>
                    </div>
                </div>
                <MoodAnalysis data={moodStats} />
            </div>

            <PnlCalendar />
        </div>
    );
}

function StatCard({ label, value, subValue, icon, highlight = "text-white" }: { label: string, value: string, subValue: string, icon: React.ReactNode, highlight?: string }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-colors group">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                    {icon}
                </div>
                <span className="text-sm font-medium text-slate-400">{label}</span>
            </div>
            <div className={`text-3xl font-bold font-mono ${highlight}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">{subValue}</div>
        </div>
    );
}

function MetricBox({ label, value, highlight = "text-white" }: { label: string, value: string, highlight?: string }) {
    return (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">{label}</span>
            <span className={`text-2xl font-black ${highlight}`}>{value}</span>
        </div>
    );
}
