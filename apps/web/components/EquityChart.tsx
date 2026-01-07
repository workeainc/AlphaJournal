"use client";

import { useMemo } from "react";
import {
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart
} from "recharts";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface EquityPoint {
    balance: number;
    timestamp: Date;
    pnl: number | null;
    tradeId?: string;
}

interface BenchmarkPoint {
    timestamp: string;
    benchmark: number;
}

interface EquityChartProps {
    data: EquityPoint[];
    benchmarkData?: BenchmarkPoint[];
}

export function EquityChart({ data, benchmarkData = [] }: EquityChartProps) {
    const router = useRouter();

    const chartData = useMemo(() => {
        // Create a map of benchmark data for easy lookup
        const benchmarkMap = new Map(
            benchmarkData.map(b => [b.timestamp, b.benchmark])
        );

        return data.map((point) => {
            const dateStr = format(new Date(point.timestamp), "MMM dd");
            // Basic lookup: might need handling for year crossing in complex apps
            // but fine for MVP view
            const benchmarkVal = benchmarkMap.get(dateStr) || null;

            return {
                name: dateStr,
                balance: point.balance,
                pnl: point.pnl || 0,
                benchmark: benchmarkVal,
                tradeId: point.tradeId,
                fullDate: point.timestamp, // Keep full date for sorting/keys if needed
            };
        });
    }, [data, benchmarkData]);

    const minBalance = Math.min(...chartData.map((d) => Math.min(d.balance, d.benchmark || d.balance)));
    const maxBalance = Math.max(...chartData.map((d) => Math.max(d.balance, d.benchmark || d.balance)));
    const domainPadding = (maxBalance - minBalance) * 0.1 || 100;

    const handlePointClick = (data: any) => {
        if (data && data.payload.tradeId) {
            router.push(`/journal/${data.payload.tradeId}`);
        }
    };

    return (
        <div className="w-full h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[minBalance - domainPadding, maxBalance + domainPadding]}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#1e293b",
                            borderRadius: "12px",
                            color: "#f8fafc"
                        }}
                        itemStyle={{ color: "#3b82f6" }}
                        formatter={(value: any, name: string | undefined) => [
                            `$${value.toLocaleString()}`,
                            name === "balance" ? "Portfolio" : "BTC Benchmark"
                        ]}
                        labelFormatter={(label) => label}
                    />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                        animationDuration={1500}
                        activeDot={{ r: 6, onClick: handlePointClick, cursor: 'pointer' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                        activeDot={false}
                        opacity={0.7}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
