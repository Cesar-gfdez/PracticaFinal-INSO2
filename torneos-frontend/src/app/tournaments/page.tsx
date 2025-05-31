"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { getTournaments, Tournament } from "@/lib/api/getTournaments";
import { gameImages } from "@/lib/gameImages";

export default function TournamentsPage() {
  const userId = useAuthStore((state) => state.userId);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTournaments()
      .then(setTournaments)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Torneos disponibles</h2>

        {userId && (
          <Button asChild>
            <Link href="/tournaments/create">Crear torneo</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando torneos...</p>
      ) : tournaments.length === 0 ? (
        <p className="text-muted-foreground">No hay torneos por ahora.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              <Link href={`/tournaments/${t.id}`} className="block">
                {/* Imagen en base al juego */}
                <img
                  src={gameImages[t.game] || "/images/default.jpg"}
                  alt={t.name}
                  className="w-full h-40 object-cover"
                />

                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{t.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">Juego: {t.game}</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Formato:{" "}
                    {t.format === "single"
                      ? "Eliminación simple"
                      : "Eliminación doble"}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}