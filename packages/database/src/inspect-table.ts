import { createClient } from "@libsql/client";

async function main() {
    const url = process.env.DATABASE_URL!;
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    const client = createClient({
        url,
        authToken
    });

    try {
        console.log("Describing table User...");
        const res = await client.execute("PRAGMA table_info(User);");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

main();
