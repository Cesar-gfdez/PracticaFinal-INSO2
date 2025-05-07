"use client";

import Link from "next/link";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { useAuthStore } from "@/store/useAuthStore";

export default function Header() {
  const userId = useAuthStore((state)=> state.userId);

  return (
    <header className="px-6 py-4 border-b flex items-center justify-between">
      <h1 className="text-xl font-bold">
        <Link href="/">Torneos</Link>
      </h1>

      <nav className="space-x-4 text-sm flex items-center">
        <Link href="/tournaments" className="hover:underline">
          Torneos
        </Link>

        {userId ? (
          <Link href="/profile" className="hover:underline">
            Perfil
          </Link>
        ) : (
          <LoginDialog />
        )}
      </nav>
    </header>
  );
}