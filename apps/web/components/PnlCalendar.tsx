"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { getDailyPnl } from "@/app/actions/portfolio";

export function PnlCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dailyData, setDailyData] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await getDailyPnl(month, year);
                setDailyData(data);
            } catch (error) {
                console.error("Failed to fetch daily PnL:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [month, year]);

    const days = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const startDayOfWeek = getDay(startOfMonth(currentDate)); // 0 = Sunday, 1 = Monday, etc.

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-emerald-400" />
                        Daily PnL Calendar
                    </h2>
                    <p className="text-slate-500 text-sm">Monthly performance breakdown</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-950/50 border border-slate-800 p-2 rounded-xl">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white font-bold min-w-[120px] text-center">
                        {format(currentDate, "MMMM yyyy")}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {/* Weekday headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}

                {/* Padding for start of month */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square"></div>
                ))}

                {/* Days with Data */}
                {days.map((day) => {
                    const dayNum = day.getDate();
                    const pnl = dailyData[dayNum] || 0;
                    const isToday = isSameDay(day, new Date());

                    let bgColor = "bg-slate-900/10 border-slate-800/50";
                    let textColor = "text-slate-500";

                    if (pnl > 0) {
                        bgColor = "bg-emerald-500/10 border-emerald-500/20";
                        textColor = "text-emerald-400";
                    } else if (pnl < 0) {
                        bgColor = "bg-red-500/10 border-red-500/20";
                        textColor = "text-red-400";
                    }

                    return (
                        <div
                            key={day.toISOString()}
                            className={`aspect-square sm:aspect-auto sm:min-h-[100px] border rounded-xl flex flex-col items-center justify-center p-2 relative group transition-all hover:scale-[1.02] hover:border-slate-600 ${bgColor} ${isToday ? 'ring-1 ring-blue-500/50' : ''}`}
                        >
                            <span className={`text-xs font-bold absolute top-2 right-2 ${isToday ? 'text-blue-400' : 'text-slate-600'}`}>
                                {dayNum}
                            </span>

                            {isLoading ? (
                                <div className="w-8 h-1 bg-slate-800 animate-pulse rounded"></div>
                            ) : (
                                pnl !== 0 && (
                                    <div className={`text-xs sm:text-sm font-black font-mono mt-1 ${textColor}`}>
                                        {pnl > 0 ? '+' : ''}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                )
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-6 mt-8 justify-center sm:justify-end text-xs font-medium border-t border-slate-800/50 pt-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
                    <span className="text-slate-500">Profit</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
                    <span className="text-slate-500">Loss</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-900/10 border border-slate-800/50"></div>
                    <span className="text-slate-500">No Data</span>
                </div>
            </div>
        </div>
    );
}
