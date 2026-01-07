import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

async function main() {
    console.log("--- DEBUG START (PRISMA 5.22 STANDARD) ---");
    const url = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    if (!url) throw new Error("Missing URL");

    try {
        console.log("Creating libSQL client...");
        const libsql = createClient({
            url,
            authToken
        });

        console.log("Initializing Adapter (passing client)...");
        const adapter = new PrismaLibSQL(libsql);

        console.log("Initializing Prisma Client...");
        const prisma = new PrismaClient({ adapter });

        console.log("Executing query...");
        const users = await prisma.user.findMany();
        console.log("SUCCESS! Found users:", users.length);

        await prisma.$disconnect();
    } catch (e: any) {
        console.error("ERROR CAUGHT:");
        console.error(e);
    }
    console.log("--- DEBUG END ---");
}

main();
