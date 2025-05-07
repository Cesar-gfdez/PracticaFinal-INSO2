"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types/match";


type Player = string | { id: number; username: string };

const getUsername = (player: Player | null | undefined): string => {
  if (!player) return "TBD";
  if (typeof player === "string") return player;
  if ("username" in player) return player.username;
  return "TBD";
};


interface Tournament {
  id: number;
  name: string;
  game: string;
  format: string;
  created_at: string;
  created_by_user_id: number;
}

interface Participant {
  id: number;
  username: string;
  avatar_url?: string;
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const userId = useAuthStore((state) => state.userId);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [generating, setGenerating] = useState(false);

  const isAlreadyJoined = userId && participants.some((p) => p.id === userId);
  const isCreator = userId === tournament?.created_by_user_id;
  const bracketExists = matches.length > 0;

  // Cargar torneo y participantes
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTournament(data.tournament);
        setParticipants(data.participants ?? []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // Cargar matches (bracket)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}/matches`)
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch((err) => console.error("Error cargando matches:", err));
  }, [id]);

  const handleJoin = async () => {
    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    setJoining(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}/join`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const updated = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}`).then((r) => r.json());
      setParticipants(updated.participants ?? []);
    } else {
      console.error("No se pudo unir al torneo");
    }

    setJoining(false);
  };

  const handleGenerateBracket = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setGenerating(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}/bracket/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      alert("Bracket generado correctamente ✅");

      const newMatches = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}/matches`).then((r) =>
        r.json()
      );
      setMatches(newMatches);
    } else {
      const err = await res.json();
      alert(`Error al generar bracket: ${err.error}`);
    }

    setGenerating(false);
  };

  const handleReportResult = async (matchId: number, winnerId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
  
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/matches/${matchId}/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ winner_id: winnerId }),
    });
  
    if (res.ok) {
      const updated = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}/matches`).then((r) => r.json());
      setMatches(updated);
    } else {
      const err = await res.json();
      alert(`Error al reportar resultado: ${err.error}`);
    }
  };

  if (loading) return <p className="text-muted-foreground">Cargando torneo...</p>;
  if (!tournament) return <p className="text-destructive">Torneo no encontrado.</p>;

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{tournament.name}</h2>
        <p className="text-sm text-muted-foreground">Juego: {tournament.game}</p>
        <p className="text-sm text-muted-foreground">
          Formato: {tournament.format === "single" ? "Eliminación simple" : "Eliminación doble"}
        </p>
        <p className="text-xs text-muted-foreground">
          Creado el: {new Date(tournament.created_at).toLocaleString()}
        </p>
      </div>

      {userId && !isAlreadyJoined && (
        <Button onClick={handleJoin} disabled={joining}>
          {joining ? "Uniéndose..." : "Unirse al torneo"}
        </Button>
      )}

      {userId && isAlreadyJoined && (
        <p className="text-green-600 font-medium">Ya estás inscrito en este torneo ✅</p>
      )}

      {isCreator && (
        <div className="space-y-2">
          <Button
            variant="secondary"
            onClick={handleGenerateBracket}
            disabled={generating || bracketExists}
          >
            {generating ? "Generando..." : "Generar bracket"}
          </Button>
          {bracketExists && (
            <p className="text-sm text-muted-foreground">El bracket ya ha sido generado.</p>
          )}
        </div>
      )}

      <div className="pt-6">
        <h3 className="text-lg font-semibold mb-2">Participantes</h3>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay participantes.</p>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.id} className="text-sm flex items-center gap-2">
                {p.avatar_url && (
                  <img src={p.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />
                )}
                {p.username}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-10">
        <h3 className="text-lg font-semibold mb-2">Bracket</h3>

        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bracket aÃºn no generado.</p>
        ) : (
          <>
            {Object.entries(
              matches.reduce<Record<number, Match[]>>((acc, match) => {
                if (!acc[match.round]) acc[match.round] = [];
                acc[match.round].push(match);
                return acc;
              }, {})
            ).map(([round, roundMatches]) => (
              <div key={round} className="mb-6">
                <h4 className="text-md font-semibold mb-2">Ronda {round}</h4>
                <ul className="space-y-2">
                  {roundMatches.map((match) => {
                    const player1Id =
                      typeof match.player1 === "object" && match.player1?.id
                        ? match.player1.id
                        : null;
                    const player2Id =
                      typeof match.player2 === "object" && match.player2?.id
                        ? match.player2.id
                        : null;

                    return (
                      <li key={match.id} className="border p-3 rounded-lg space-y-2">
                        <p>
                          <strong>{getUsername(match.player1)}</strong> vs{" "}
                          <strong>{getUsername(match.player2)}</strong>
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Estado: {match.status}
                        </p>

                        {match.status === "pending" &&
                          (isCreator || userId === player1Id || userId === player2Id) && (
                            <div className="flex gap-2">
                              {player1Id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReportResult(match.id, player1Id)}
                                >
                                  Gana {getUsername(match.player1)}
                                </Button>
                              )}
                              {player2Id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReportResult(match.id, player2Id)}
                                >
                                  Gana {getUsername(match.player2)}
                                </Button>
                              )}
                            </div>
                          )}

                        {match.status === "completed" && match.winner && (
                          <p className="text-green-600 text-sm font-medium">
                            Ganador: {getUsername(match.winner)}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}