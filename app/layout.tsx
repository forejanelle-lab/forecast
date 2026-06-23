import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fore Cast — The Future of Casting",
  description:
    "The modern operating system for the entertainment industry. Connect actors and casting directors through a premium, collaborative experience.",
  keywords: ["casting", "actors", "entertainment", "auditions", "film", "television"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
