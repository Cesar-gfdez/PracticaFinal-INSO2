import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { LoginDialog } from "@/components/auth/LoginDialog";

export const metadata: Metadata = {
  title: "Torneos",
  description: "Plataforma de torneos competitivos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground min-h-screen">
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <Link href="/">Torneos</Link>
          </h1>

          <nav className="space-x-4 text-sm flex items-center">
            <Link href="/tournaments" className="hover:underline">Torneos</Link>
            <Link href="/profile" className="hover:underline">Perfil</Link>
            <LoginDialog />
          </nav>
        </header>

        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}