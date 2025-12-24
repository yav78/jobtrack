import { AppShell } from "@/components/layout/app-shell";
import { SideBar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AuthButton } from "@/components/auth/AuthButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <SideBar />
      <div className="flex flex-1 flex-col bg-white dark:bg-neutral-950">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="text-base font-semibold">Mini CRM Recherche d&apos;emploi</div>
          <div className="flex items-center gap-3">
            <AuthButton />
            <ThemeToggle />
          </div>
        </header>
        <AppShell>{children}</AppShell>
      </div>
    </div>
  );
}
