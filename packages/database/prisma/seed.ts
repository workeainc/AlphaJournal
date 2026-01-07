import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // 1. Create Mock User
    const user = await prisma.user.upsert({
        where: { email: "trader@alphajournal.com" },
        update: {},
        create: {
            email: "trader@alphajournal.com",
            name: "Alpha Trader",
            initialBalance: 10000,
            currency: "USDT",
            riskTolerance: 2.0,
        },
    });
    console.log("✅ Created user:", user.email);

    // 2. Create Default Account
    const account = await prisma.tradingAccount.upsert({
        where: { id: "default-account" },
        update: {},
        create: {
            id: "default-account",
            name: "Main Trading Account",
            balance: 10000,
            currency: "USDT",
            userId: user.id,
        },
    });
    console.log("✅ Created account:", account.name);

    // 3. Create Default Pre-Trade Checklist
    const checklist = await prisma.preTradeChecklist.upsert({
        where: { id: "default-checklist" },
        update: {},
        create: {
            id: "default-checklist",
            name: "Standard Pre-Trade Checklist",
            description: "Professional trader's discipline checklist",
            isDefault: true,
        },
    });
    console.log("✅ Created checklist:", checklist.name);

    // 4. Create Checklist Items
    const checklistItems = [
        {
            id: "item-technical-trigger",
            checklistId: checklist.id,
            label: "Technical Trigger",
            description: "Did price close above/below the Key Level?",
            type: "YES_NO",
            weight: 20,
            order: 1,
            required: true,
            options: JSON.stringify(["YES", "NO"]),
        },
        {
            id: "item-trend-alignment",
            checklistId: checklist.id,
            label: "Trend Alignment",
            description: "Is the High Time Frame (HTF) trend supporting this?",
            type: "MULTIPLE_CHOICE",
            weight: 20,
            order: 2,
            required: true,
            options: JSON.stringify(["YES", "NO", "COUNTER_TREND"]),
        },
        {
            id: "item-risk-acceptance",
            checklistId: checklist.id,
            label: "Risk Acceptance",
            description: "Am I okay losing this amount on this trade?",
            type: "YES_NO",
            weight: 20,
            order: 3,
            required: true,
            options: JSON.stringify(["YES", "NO"]),
        },
        {
            id: "item-event-risk",
            checklistId: checklist.id,
            label: "No Event Risk",
            description: "Is there major news (FOMC/CPI) in the next hour?",
            type: "YES_NO",
            weight: 20,
            order: 4,
            required: true,
            options: JSON.stringify(["NO_NEWS", "NEWS_COMING"]),
        },
        {
            id: "item-mental-state",
            checklistId: checklist.id,
            label: "Mental State",
            description: "Am I calm, or am I revenge trading?",
            type: "MULTIPLE_CHOICE",
            weight: 20,
            order: 5,
            required: true,
            options: JSON.stringify(["CALM", "TILT", "REVENGE"]),
        },
    ];

    for (const item of checklistItems) {
        await prisma.checklistItem.upsert({
            where: { id: item.id },
            update: {},
            create: item,
        });
    }
    console.log(`✅ Created ${checklistItems.length} checklist items`);

    console.log("\n🎉 Seeding complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
