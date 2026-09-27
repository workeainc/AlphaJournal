import { handlers } from "@/auth";
export const { GET, POST } = handlers;
// Prisma's adapter uses Node.js APIs and cannot initialize in Vercel's
// Edge runtime. Keep authentication on the Node.js runtime.
export const runtime = "nodejs";
