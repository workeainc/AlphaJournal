"use client";

import { useState } from "react";
import { updateUserProfile } from "@/app/actions/user";
import { DollarSign, Globe, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
    user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setMessage(null);

        try {
            const initialBalance = parseFloat(formData.get("initialBalance") as string);
            const currency = formData.get("currency") as string;
            const riskTolerance = parseFloat(formData.get("riskTolerance") as string);

            await updateUserProfile({
                initialBalance,
                currency,
                riskTolerance
            });

            setMessage({ type: 'success', text: "Settings saved successfully" });
            router.refresh(); // Refresh server components to show up-to-date data
        } catch (error) {
            setMessage({ type: 'error', text: "Failed to save settings" });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Trading Parameters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Initial Balance</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">$</div>
                            <input
                                name="initialBalance"
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                                defaultValue={user.initialBalance}
                                step="any"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Currency</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Globe className="w-4 h-4 text-slate-500" /></div>
                            <select
                                name="currency"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                defaultValue={user.currency || "USDT"}
                            >
                                <option value="USDT">USDT (Tether)</option>
                                <option value="USD">USD (Dollar)</option>
                                <option value="EUR">EUR (Euro)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-400">Default Risk % per Trade</label>
                        <div className="flex items-center space-x-4">
                            <input
                                name="riskTolerance"
                                type="range"
                                min="0.1"
                                max="10"
                                step="0.1"
                                className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                defaultValue={user.riskTolerance}
                                onChange={(e) => {
                                    const displayInfo = document.getElementById('risk-display');
                                    if (displayInfo) displayInfo.innerText = `${e.target.value}%`;
                                }}
                            />
                            <div id="risk-display" className="w-16 bg-slate-950 border border-slate-800 rounded px-3 py-1 text-center font-mono text-blue-400 font-bold">
                                {user.riskTolerance}%
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Recommended: 1-2% for sustainable growth.</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="flex justify-end gap-4">
                <button
                    type="reset"
                    className="px-6 py-2 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
                >
                    Reset Changes
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Settings
                </button>
            </div>
        </form>
    );
}
