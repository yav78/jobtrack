import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/lib/actions";

export async function AuthButton() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">
          {session.user.name || session.user.email}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Déconnexion
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-md border border-blue-500 bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600"
    >
      Se connecter
    </Link>
  );
}
