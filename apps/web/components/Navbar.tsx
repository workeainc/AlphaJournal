"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { User, LogOut, LayoutDashboard, Activity, PieChart, Settings } from "lucide-react";

export function Navbar() {
    const { data: session, status } = useSession();

    return (
        <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                Alpha Journal
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-4">
                            <Link href="/" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Calculator</span>
                            </Link>
                            <Link href="/journal" className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors">
                                <Activity className="w-4 h-4" />
                                <span>Journal</span>
                            </Link>
                            <Link href="/portfolio" className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors">
                                <PieChart className="w-4 h-4" />
                                <span>Portfolio</span>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {status === "authenticated" ? (
                            <div className="flex items-center space-x-4">
                                <Link href="/profile" className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-900 transition-all border border-transparent hover:border-slate-800">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <User className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className="hidden sm:inline text-sm font-medium text-slate-200">
                                        {session.user?.name || "Trader"}
                                    </span>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
