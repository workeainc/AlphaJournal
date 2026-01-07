import { getCurrentUser } from "@/app/actions/user";
import { User, DollarSign, Percent, Globe, Shield } from "lucide-react";
import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
    // Note: This will throw "Not authenticated" if not signed in
    // Real V2 will have a login page redirect
    let user;
    try {
        user = await getCurrentUser();
    } catch (e) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <Shield className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
                <p className="text-slate-400 mb-8">Please sign in to view and manage your trading profile.</p>
                <div className="flex justify-center">
                    {/* NextAuth signIn buttons would go here */}
                    <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">Return to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 text-center md:text-left">
                    Trading Profile
                </h1>
                <p className="text-slate-400 text-lg text-center md:text-left">
                    Configure your trading parameters and account settings.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm sticky top-24">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center border-4 border-slate-900 shadow-xl overflow-hidden">
                            {user.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{user.name || "Alpha Trader"}</h2>
                        <p className="text-sm text-slate-500 mb-6">{user.email}</p>

                        <div className="space-y-3 pt-6 border-t border-slate-800">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                                <span>MEMBER SINCE</span>
                                <span>{new Date(user.createdAt).getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <ProfileForm user={user} />
                </div>
            </div>
        </div>
    );
}
