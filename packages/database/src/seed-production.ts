import { prisma } from "./index";

async function main() {
    console.log("🌱 Seeding production database...");

    // 1. Create Default Pre-Trade Checklist
    // Use upsert to avoid duplicates if run multiple times
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
    console.log("✅ Created/Verified checklist:", checklist.name);

    // 2. Create Checklist Items
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
            update: {
                label: item.label,
                description: item.description,
                type: item.type as any,
                weight: item.weight,
                order: item.order,
                required: item.required,
                options: item.options,
            },
            create: item as any,
        });
    }
    console.log(`✅ Created/Updated ${checklistItems.length} checklist items`);

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
