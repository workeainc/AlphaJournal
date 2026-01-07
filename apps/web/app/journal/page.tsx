import { getTrades } from "@/app/actions/trade";
import { JournalStats } from "@/components/JournalStats";
import { JournalTable } from "@/components/JournalTable";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function JournalPage() {
    const session = await auth();

    if (!session) {
        redirect("/api/auth/signin");
    }

    const trades = await getTrades();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 uppercase">
                    Trade Journal
                </h1>
                <p className="text-slate-400 text-lg">
                    Manage your trade history and analyze your performance.
                </p>
            </header>

            <JournalStats trades={trades} />

            <JournalTable initialTrades={trades} />
        </div>
    );
}
