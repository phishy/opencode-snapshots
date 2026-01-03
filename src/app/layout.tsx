import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCode Snapshots",
  description: "Browse and restore OpenCode snapshots",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <nav className="border-b border-zinc-800 px-6 py-4">
          <a href="/" className="text-xl font-semibold text-white hover:text-zinc-300">
            OpenCode Snapshots
          </a>
        </nav>
        <main className="container mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
