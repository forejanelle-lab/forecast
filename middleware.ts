import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Auth pages handle their own redirects in layouts; skip middleware here for faster sign-in.
  matcher: ["/actor/:path*", "/casting/:path*", "/projects/:path*", "/admin/:path*"],
};
