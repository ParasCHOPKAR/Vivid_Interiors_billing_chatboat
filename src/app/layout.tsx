import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Vivid Interiors — Architecture, Design & Turnkey Billing Software",
  description:
    "AI-powered multilingual billing & invoicing software for Vivid Interiors (Erandwane, Pune). Fast invoicing for residential interiors, modular kitchens, custom wardrobes, false ceilings, and turnkey execution with English, Hindi, and Marathi voice ingestion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-slate-50 antialiased text-slate-900">
        <Suspense fallback={<div className="no-print w-64 bg-slate-900 min-h-screen shrink-0" />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
