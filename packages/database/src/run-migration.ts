import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Running migration...");
    const url = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    if (!url) throw new Error("Missing DATABASE_URL");

    const sqlPath = path.join(__dirname, "../turso_init.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // Split statements by semicolon
    const statements = sqlContent
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const client = createClient({
        url,
        authToken
    });

    try {
        for (const statement of statements) {
            console.log("Executing statement...");
            // console.log(statement.substring(0, 50) + "..."); 
            await client.execute(statement);
        }
        console.log("Migration completed successfully!");
    } catch (e: any) {
        console.error("Migration failed:", e);
    } finally {
        client.close();
    }
}

main();
