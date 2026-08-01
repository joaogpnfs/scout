import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Scout",
  description: "Capture screenshots, route them to structured data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <nav className="flex items-center gap-4 border-b border-zinc-800 px-6 py-3 text-xs text-zinc-400">
          <Link href="/capture" className="hover:text-zinc-100">
            Capture
          </Link>
          <Link href="/collections" className="hover:text-zinc-100">
            Collections
          </Link>
          <Link href="/library" className="hover:text-zinc-100">
            Library
          </Link>
          <Link href="/metrics" className="hover:text-zinc-100">
            Metrics
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
