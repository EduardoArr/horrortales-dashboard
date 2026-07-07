import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// A valid bcrypt hash with no matching password, used to keep the
// authorize() timing profile identical whether or not the email exists —
// otherwise an attacker can enumerate registered emails by measuring
// response time (early return vs. a full bcrypt.compare).
const DUMMY_HASH = bcrypt.hashSync("no-such-user-timing-safety", 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Without this, Auth.js throws UntrustedHost on any deployment where it
  // can't auto-detect a trusted platform (e.g. self-hosted / `next start`
  // without VERCEL=1) — and when that throw happens inside proxy.ts, the
  // auth check must still fail closed (see proxy.ts's req.auth?.user
  // check). Safe here because Vercel terminates TLS and owns the routing
  // layer in front of this app.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const isValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
