import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { isEmailVerified } from "@/lib/auth-helpers";
import { getUserDisplayName } from "@/lib/user";
import { recordBusinessEvent } from "@/lib/analytics/record";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;
        const rememberMe =
          credentials.rememberMe === "true" || credentials.rememberMe === true;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          void recordBusinessEvent({
            eventType: "LOGIN",
            userId: user.id,
            userRole: user.role,
          });

          return {
            id: user.id,
            email: user.email,
            name: getUserDisplayName(user),
            image: user.image,
            role: user.role,
            isEmailVerified: isEmailVerified(user.emailVerified),
            rememberMe,
          };
        } catch (error) {
          console.error("Auth database error:", error);
          return null;
        }
      },
    }),
  ],
});
