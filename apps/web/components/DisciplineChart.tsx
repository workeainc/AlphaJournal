"use client";

import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from "recharts";

interface CorrelationPoint {
    score: number;
    pnl: number;
    symbol: string;
}

interface DisciplineChartProps {
    data: CorrelationPoint[];
}

export function DisciplineChart({ data }: DisciplineChartProps) {
    return (
        <div className="w-full h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        type="number"
                        dataKey="score"
                        name="Checklist Score"
                        unit="%"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                    />
                    <YAxis
                        type="number"
                        dataKey="pnl"
                        name="Profit/Loss"
                        unit="$"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#1e293b",
                            borderRadius: "12px",
                            color: "#f8fafc"
                        }}
                        formatter={(value: any, name: string | undefined) => [
                            name === "Profit/Loss" ? `$${value.toLocaleString()}` : `${value}%`,
                            name || ""
                        ]}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                    <Scatter name="Trades" data={data}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                                fillOpacity={0.6}
                                stroke={entry.pnl >= 0 ? "#059669" : "#dc2626"}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
