import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Fore Cast",
  description: "Sign in to your Fore Cast account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
