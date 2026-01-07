import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        GitHub,
        Google,
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
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
});
