import { createClient } from "@libsql/client";

async function main() {
    const url = process.env.DATABASE_URL!;
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    const client = createClient({
        url,
        authToken
    });

    const tables = [
        "_TagToTrade",
        "Tag",
        "Trade",
        "TradeChecklistResponse",
        "ChecklistItem",
        "PreTradeChecklist",
        "BalanceSnapshot",
        "TradingAccount",
        "VerificationToken",
        "Session",
        "accounts",
        "User"
    ];

    try {
        for (const table of tables) {
            console.log(`Dropping table ${table}...`);
            await client.execute(`DROP TABLE IF EXISTS "${table}";`);
        }
        console.log("All tables dropped.");
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

main();
