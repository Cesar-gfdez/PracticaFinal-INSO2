import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/ui/Header";
import SessionHandler from "@/components/auth/SessionHandler";

export const metadata: Metadata = {
  title: "Torneos",
  description: "Plataforma de torneos competitivos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground min-h-screen">
        <Header />
        <SessionHandler />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}