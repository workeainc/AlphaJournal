import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Only advertise OAuth providers when their Vercel credentials are configured.
// Otherwise Auth.js generates links such as `client_id=undefined`, which sends
// users to a broken provider page instead of offering the working credentials
// login.
const providers = [
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET ? [GitHub] : []),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
    Credentials({
        name: "Dev Mock Login",
        credentials: {
            email: { label: "Email", type: "email", placeholder: "trader@alphajournal.com" },
        },
        async authorize(credentials) {
            if (!credentials?.email) return null;

            // Find or create the user in the database
            let user = await prisma.user.findUnique({
                where: { email: credentials.email as string },
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: credentials.email as string,
                        name: "Mock Trader",
                        initialBalance: 10000,
                        riskTolerance: 2.0,
                    },
                });
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
            };
        },
    }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma) as any,
    providers,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }: any) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
}) as any;
