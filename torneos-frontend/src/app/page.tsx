"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full min-h-[80vh] flex flex-col items-center justify-center text-center text-white bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient">
        <h1 className="text-6xl font-extrabold tracking-tight drop-shadow-lg mb-6 animate-fade-in">
          Matchitos
        </h1>
        <p className="text-xl opacity-90 mb-6 animate-fade-in delay-100">
          Crea, juega y compite en torneos online. ¡Demuestra quién manda!
        </p>
        <Button asChild size="lg" className="text-lg animate-fade-in delay-200">
          <Link href="/tournaments">Explorar torneos</Link>
        </Button>
      </section>

      {/* About Section */}
      <section className="max-w-5xl mx-auto py-16 px-6 text-center space-y-6">
        <h2 className="text-3xl font-bold">¿Qué es Matchitos?</h2>
        <p className="text-lg text-muted-foreground">
          Matchitos es tu plataforma de torneos online. Organiza competiciones con tus amigos,
          únete a torneos de tus juegos favoritos y escala en el ranking global.
        </p>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 px-6 text-center">
          <div>
            <div className="text-4xl mb-2">🔥</div>
            <h3 className="text-xl font-semibold mb-2">Fácil de usar</h3>
            <p className="text-muted-foreground text-sm">
              Crea torneos en segundos. Invita a tus amigos y empieza a competir.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Rankings globales</h3>
            <p className="text-muted-foreground text-sm">
              Gana puntos, sube en el ranking y presume de tu posición.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Notificaciones en tiempo real</h3>
            <p className="text-muted-foreground text-sm">
              Recibe notificaciones cuando se generan brackets o se reportan resultados.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}