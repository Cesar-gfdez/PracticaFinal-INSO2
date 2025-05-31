"use client";

import { useEffect, useState } from "react";
import { getRankings, RankingUser } from "@/lib/api/getRankings";

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRankings()
      .then(setRankings)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h2 className="text-3xl font-bold text-center mb-6">Ranking global de jugadores</h2>

      {loading ? (
        <p className="text-muted-foreground text-center">Cargando ranking...</p>
      ) : rankings.length === 0 ? (
        <p className="text-muted-foreground text-center">No hay jugadores en el ranking aún.</p>
      ) : (
        <>
          {/* Podium escalonado */}
        <div className="flex justify-center items-end gap-4">
        {[1, 0, 2].map((i) => {
            const player = top3[i];
            if (!player) return null;

            let bgColor = "";
            let height = "";

            if (i === 0) {
            bgColor = "bg-yellow-400";
            height = "h-40"; // más alto
            } else if (i === 1) {
            bgColor = "bg-gray-300";
            height = "h-32"; // medio
            } else if (i === 2) {
            bgColor = "bg-orange-400";
            height = "h-28"; // más bajo
            }

            return (
            <div
                key={player.id}
                className="flex flex-col items-center w-20"
            >
                <div
                className={`w-full ${height} ${bgColor} flex items-center justify-center rounded-t-md text-white font-bold text-xl shadow-md`}
                >
                #{i + 1}
                </div>
                <div className="mt-2 text-center">
                <p className="font-medium">{player.username}</p>
                <p className="text-sm text-muted-foreground">{player.points} pts</p>
                </div>
            </div>
            );
        })}
        </div>




          {/* Ranking list from 4th place */}
          {rest.length > 0 && (
            <div className="pt-8 space-y-2">
              <h3 className="text-xl font-semibold mb-2">Resto del ranking</h3>
              <ul className="space-y-2">
                {rest.map((player, index) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-4 p-4 border rounded-lg shadow-sm bg-background"
                  >
                    <span className="text-xl font-bold w-8 text-center">
                      #{index + 4}
                    </span>

                    <div className="flex-1">
                      <p className="font-medium">{player.username}</p>
                    </div>

                    <div className="text-right text-sm font-semibold text-primary">
                      {player.points} pts
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}