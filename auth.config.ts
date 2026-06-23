import type { NextAuthConfig } from "next-auth";
import { isAdminEmail } from "@/lib/admin-access";

export type AppUserRole = "ACTOR" | "CASTING";

const SESSION_MAX_AGE_DEFAULT = 24 * 60 * 60;
const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: AppUserRole;
      isEmailVerified: boolean;
    };
  }

  interface User {
    role: AppUserRole;
    isEmailVerified?: boolean;
    rememberMe?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: AppUserRole;
    isEmailVerified: boolean;
    rememberMe?: boolean;
  }
}

const PUBLIC_AUTH_PATHS = [
  "/auth/signin",
  "/auth/signup",
  "/auth/signup/actor",
  "/auth/signup/casting",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/actor-onboarding",
  "/auth/casting-onboarding",
];

function isPathMatch(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_REMEMBER,
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.isEmailVerified = Boolean(user.isEmailVerified);
        token.rememberMe = user.rememberMe ?? false;

        const maxAge = user.rememberMe
          ? SESSION_MAX_AGE_REMEMBER
          : SESSION_MAX_AGE_DEFAULT;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }

      if (trigger === "update") {
        const updated = session as { isEmailVerified?: boolean } | undefined;
        if (updated?.isEmailVerified !== undefined) {
          token.isEmailVerified = updated.isEmailVerified;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppUserRole;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isEmailVerified = auth?.user?.isEmailVerified ?? false;

      const isAuthPage = pathname.startsWith("/auth");
      const isActorRoute = pathname.startsWith("/actor");
      const isCastingRoute =
        pathname.startsWith("/casting") || pathname.startsWith("/projects");
      const isAdminRoute = pathname.startsWith("/admin");

      if (!isLoggedIn && (isActorRoute || isCastingRoute || isAdminRoute)) {
        return false;
      }

      if (isLoggedIn && isAdminRoute && !isAdminEmail(auth?.user?.email)) {
        return Response.redirect(new URL("/", request.url));
      }

      if (isLoggedIn && !isEmailVerified) {
        if (pathname === "/auth/signin" || pathname === "/auth/signup") {
          const destination = role === "CASTING" ? "/casting" : "/actor";
          return Response.redirect(new URL(destination, request.url));
        }
      }

      if (isLoggedIn && isEmailVerified && isAuthPage) {
        if (pathname === "/auth/casting-onboarding") {
          return role === "CASTING";
        }
        if (pathname === "/auth/actor-onboarding") {
          return role === "ACTOR";
        }
        if (pathname === "/auth/verify-email") {
          const destination = role === "CASTING" ? "/casting" : "/actor";
          return Response.redirect(new URL(destination, request.url));
        }
        if (!isPathMatch(pathname, PUBLIC_AUTH_PATHS)) {
          const destination = role === "CASTING" ? "/casting" : "/actor";
          return Response.redirect(new URL(destination, request.url));
        }
      }

      if (isLoggedIn && isActorRoute && role === "CASTING") {
        return Response.redirect(new URL("/casting", request.url));
      }

      if (isLoggedIn && isCastingRoute && role === "ACTOR") {
        return Response.redirect(new URL("/actor", request.url));
      }

      return true;
    },
  },
};
