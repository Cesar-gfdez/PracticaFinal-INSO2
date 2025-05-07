"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { getTournaments, Tournament } from "@/lib/api/getTournaments";

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
    <div className="max-w-4xl mx-auto py-10">
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
        <ul className="space-y-4">
          {tournaments.map((t) => (
           <li key={t.id} className="border p-4 rounded-lg hover:bg-muted transition">
           <Link href={`/tournaments/${t.id}`}>
             <h3 className="text-lg font-semibold">{t.name}</h3>
             <p className="text-sm text-muted-foreground">Juego: {t.game}</p>
             <p className="text-sm text-muted-foreground">
               Formato: {t.format === "single" ? "Eliminación simple" : "Eliminación doble"}
             </p>
           </Link>
         </li>
          ))}
        </ul>
      )}
    </div>
  );
}