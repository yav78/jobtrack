import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { SideBar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ToastProvider } from "@/components/common/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jobtrack - Mini CRM Recherche d'emploi",
  description: "Suivi des entreprises, contacts, opportunités et entretiens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider />
        <div className="flex min-h-screen bg-background text-foreground">
          <SideBar />
          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="text-base font-semibold">Mini CRM Recherche d&apos;emploi</div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
              </div>
            </header>
            <AppShell>{children}</AppShell>
          </div>
        </div>
      </body>
    </html>
  );
}
