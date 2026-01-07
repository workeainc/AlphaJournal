import { getTradeById } from "@/app/actions/trade";
import { format } from "date-fns";
import {
    ChevronLeft,
    Calendar,
    Link as LinkIcon,
    FileText,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CloseTradeForm } from "@/components/CloseTradeForm";

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const trade = await getTradeById(id);

    if (!trade) {
        notFound();
    }

    const isTradeOpen = trade.status === "OPEN";

    const responses = trade.checklistResponse
        ? JSON.parse(trade.checklistResponse.responses)
        : {};

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/journal"
                className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8 group"
            >
                <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Journal
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        {trade.symbol}
                        <span className={`text-lg px-3 py-1 rounded-lg ${trade.direction === "LONG"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                            {trade.direction}
                        </span>
                        {trade.mood && (
                            <span className="text-lg px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-2">
                                <span>
                                    {trade.mood === "CALM" ? "🧘" :
                                        trade.mood === "EXCITED" ? "🤩" :
                                            trade.mood === "TIRED" ? "😴" :
                                                trade.mood === "FRUSTRATED" ? "😤" :
                                                    trade.mood === "ANGRY" ? "🤬" :
                                                        trade.mood === "REVENGE" ? "🔥" : "❔"}
                                </span>
                                {trade.mood}
                            </span>
                        )}
                    </h1>
                    <div className="flex items-center space-x-4 mt-2 text-slate-400">
                        <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(trade.createdAt), "MMMM dd, yyyy 'at' HH:mm")}</span>
                        </div>
                        <span className="text-slate-800">•</span>
                        <div className="flex items-center space-x-1">
                            <span className={`w-2 h-2 rounded-full ${trade.status === 'OPEN' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                            <span className="capitalize">{trade.status}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm min-w-[200px]">
                    <div className="text-sm text-slate-400 mb-1">Quality Score</div>
                    <div className="flex items-end justify-between gap-4">
                        <span className="text-4xl font-bold text-white">{trade.checklistScore}%</span>
                        <div className={`text-xs px-2 py-1 rounded font-bold ${trade.checklistScore! >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                            trade.checklistScore! >= 60 ? "bg-blue-500/10 text-blue-400" :
                                "bg-red-500/10 text-red-400"
                            }`}>
                            {trade.checklistScore! >= 80 ? "EXCELLENT" : trade.checklistScore! >= 60 ? "PASSING" : "FAIL"}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Left: Trade Details */}
                <div className={`${isTradeOpen ? "lg:col-span-8" : "lg:col-span-6"} space-y-8`}>
                    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            Execution Details
                        </h2>

                        <div className="space-y-4">
                            <DetailItem label="Entry Price" value={`$${trade.entryPrice.toLocaleString()}`} />
                            <DetailItem label="Stop Loss" value={`$${trade.stopLoss.toLocaleString()}`} />
                            <DetailItem label="Target Price" value={trade.targetPrice ? `$${trade.targetPrice.toLocaleString()}` : "N/A"} />
                            <div className="h-px bg-slate-800/50 my-4"></div>
                            <DetailItem label="Quantity" value={trade.quantity.toString()} />
                            <DetailItem label="Risk Amount" value={`$${trade.riskAmount.toLocaleString()}`} />
                            <DetailItem
                                label="Realized PnL"
                                value={trade.pnl !== null ? `$${trade.pnl.toLocaleString()}` : "N/A"}
                                highlight={trade.pnl !== null ? (trade.pnl >= 0 ? "text-emerald-400" : "text-red-400") : ""}
                            />
                            {trade.exitPrice && (
                                <DetailItem label="Exit Price" value={`$${trade.exitPrice.toLocaleString()}`} highlight="text-emerald-400" />
                            )}
                        </div>
                    </div>

                    {isTradeOpen && (
                        <CloseTradeForm
                            tradeId={trade.id}
                            entryPrice={trade.entryPrice}
                            quantity={trade.quantity}
                            direction={trade.direction as "LONG" | "SHORT"}
                        />
                    )}
                </div>

                {/* Right: Checklist */}
                <div className={`${isTradeOpen ? "lg:col-span-4" : "lg:col-span-6"}`}>
                    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm h-full">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            Discipline Checklist
                        </h2>

                        <div className="space-y-4">
                            {Object.entries(responses).map(([key, value]) => (
                                <div key={key} className="flex flex-col p-3 rounded-lg bg-slate-800/20 border border-slate-800/50">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                        {key.replace(/-/g, ' ').replace('item ', '')}
                                    </span>
                                    <span className={`text-sm font-bold ${['YES', 'CALM', 'NO_NEWS'].includes(value as string) ? 'text-emerald-400' : 'text-slate-400'
                                        }`}>
                                        {value as string}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {trade.notes && (
                <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm mb-12">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Trading Notes
                    </h2>
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {trade.notes}
                    </p>
                </div>
            )}

            {trade.tradingViewLink && (
                <div className="flex justify-center">
                    <a
                        href={trade.tradingViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                        <LinkIcon className="w-5 h-5" />
                        <span>View Chart on TradingView</span>
                    </a>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, highlight = "text-white" }: { label: string, value: string, highlight?: string }) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-sm text-slate-400">{label}</span>
            <span className={`font-bold transition-colors ${highlight}`}>{value}</span>
        </div>
    );
}
