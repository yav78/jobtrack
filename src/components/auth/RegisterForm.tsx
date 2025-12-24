"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/lib/actions";

export default function RegisterForm() {
  const [errorMessage, formAction, isPending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-neutral-50 px-6 pb-4 pt-8 dark:bg-neutral-900">
        <h1 className="mb-3 text-2xl font-semibold">Créez votre compte</h1>
        <div className="w-full space-y-4">
          <div>
            <label
              className="mb-2 block text-xs font-medium text-neutral-900 dark:text-neutral-100"
              htmlFor="fullName"
            >
              Nom complet
            </label>
            <input
              className="peer block w-full rounded-md border border-neutral-200 py-[9px] px-3 text-sm outline-2 placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-medium text-neutral-900 dark:text-neutral-100"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="peer block w-full rounded-md border border-neutral-200 py-[9px] px-3 text-sm outline-2 placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              id="email"
              type="email"
              name="email"
              placeholder="Entrez votre adresse email"
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-medium text-neutral-900 dark:text-neutral-100"
              htmlFor="password"
            >
              Mot de passe
            </label>
            <input
              className="peer block w-full rounded-md border border-neutral-200 py-[9px] px-3 text-sm outline-2 placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              id="password"
              type="password"
              name="password"
              placeholder="Au moins 6 caractères"
              minLength={6}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 flex h-10 w-full items-center rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:bg-blue-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-disabled={isPending}
        >
          Créer mon compte
          <svg
            className="ml-auto h-5 w-5 text-gray-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>

        <div className="flex h-8 items-end space-x-1">
          {errorMessage && (
            <>
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Déjà un compte ?{" "}
          <Link className="font-semibold text-blue-500 hover:text-blue-400" href="/login">
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  );
}
