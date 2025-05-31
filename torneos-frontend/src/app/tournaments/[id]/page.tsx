"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types/match";
import { useRouter } from "next/navigation";



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
  type: string;
  start_time: string;
  platform: string;
  max_participants: number;
  is_finished: boolean;
  created_by_user_id: number;
  banner_url: string;
  description?: string;
  rules?: string[];
  champion?: Champion; 
}

interface Champion {
  id: number;
  username: string;
  avatar_url?: string;
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
  const [screenshotFiles, setScreenshotFiles] = useState<Record<number, File | null>>({});


  const isAlreadyJoined = !!userId && participants.some((p) => p.id === userId);
  const isCreator = userId === tournament?.created_by_user_id;
  const bracketExists = (matches?.length ?? 0) > 0;
  const router = useRouter();


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
        Authorization: `Bearer ${token}`,
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

  const handleLeave = async () => {
  const token = localStorage.getItem("token");
  if (!token || !userId) {
    alert("Debes iniciar sesión para darte de baja del torneo.");
    return;
  }

  setJoining(true); // podemos reutilizar el estado joining para el loading del botón

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}/leave`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.ok) {
    const updated = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}`).then((r) => r.json());
    setParticipants(updated.participants ?? []);
    alert("Te has dado de baja correctamente del torneo.");
  } else {
    const err = await res.json();
    alert(`Error al darse de baja: ${err.error}`);
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

    // 1️⃣ Subir imagen si hay
    const screenshotFile = screenshotFiles[matchId];
    if (screenshotFile) {
      const formData = new FormData();
      formData.append("file", screenshotFile);

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/matches/${matchId}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(`Error al subir captura: ${err.error}`);
        return;
      }
    }

    // 2️⃣ Reportar resultado
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/matches/${matchId}/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ winner_id: winnerId }),
    });

    if (res.ok) {
      const updated = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}/matches`).then((r) =>
        r.json()
      );
      setMatches(updated);

      // Limpia la imagen subida para ese match
      setScreenshotFiles((prev) => ({ ...prev, [matchId]: null }));

      alert("Resultado reportado correctamente");
    } else {
      const err = await res.json();
      alert(`Error al reportar resultado: ${err.error}`);
    }
  };


const handleDeleteTournament = async () => {
  const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.");
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Debes iniciar sesión.");
    return;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${tournament?.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    alert("Torneo eliminado correctamente ✅");
    router.push("/tournaments"); // Redirigir a la lista de torneos
  } else {
    const err = await res.json();
    alert(`Error al eliminar torneo: ${err.error}`);
  }
};



  if (loading) return <p className="text-muted-foreground">Cargando torneo...</p>;
  if (!tournament) return <p className="text-destructive">Torneo no encontrado.</p>;

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-8">
      {/* Banner + título */}
      <div className="rounded-lg overflow-hidden shadow">
        {tournament.banner_url && (
          <img src={tournament.banner_url} alt={tournament.name} className="w-full h-64 object-cover" />
        )}
        <div className="p-6 bg-background">
          <h2 className="text-3xl font-bold mb-2">{tournament.name}</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded">
              {tournament.type === "solo" ? "INDIVIDUAL" : "INDIVIDUAL"}
            </span>
            <span className="px-2 py-1 text-xs font-semibold bg-muted text-foreground rounded">
              {tournament.game}
            </span>
            <span className="px-2 py-1 text-xs font-semibold bg-yellow-500 text-white rounded">
              {tournament.is_finished ? "FINISHED" : "UPCOMING"}
            </span>
          </div>
          <p className="text-muted-foreground">{tournament.description}</p>
        </div>
      </div>

      {/* Details + Registration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tournament details */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold mb-2">Tournament Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold">Date & Time</p>
              <p>{new Date(tournament.start_time).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-semibold">Participants</p>
              <p>
                {participants.length} / {tournament.max_participants}
              </p>
            </div>
            <div>
              <p className="font-semibold">Platform</p>
              <p>{tournament.platform}</p>
            </div>
            <div>
              <p className="font-semibold">Format</p>
              <p>{tournament.format === "single" ? "Eliminación simple" : "Eliminación doble"}</p>
            </div>
          </div>

          {/* Rules */}
          {tournament.rules && tournament.rules.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Rules & Requirements</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {tournament.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Registration */}
        <div className="space-y-4 p-4 border rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Registration</h3>

          {isCreator && (
            <Button
              variant="secondary"
              onClick={handleGenerateBracket}
              disabled={generating || bracketExists}
              className="w-full"
            >
              {generating ? "Generando..." : "Generar bracket"}
            </Button>
          )}

          {!isAlreadyJoined && (
            <Button onClick={handleJoin} disabled={joining} className="w-full">
              {joining ? "Uniéndose..." : "Unirse al torneo"}
            </Button>
          )}

          {isAlreadyJoined && (
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={joining}
              className="w-full"
            >
              {joining ? "Dándose de baja..." : "Darse de baja"}
            </Button>
          )}

          {/* Acciones del creador */}
          {isCreator && (
            <div className="space-y-2">

              {/* Botón Editar */}
              <Button
                variant="outline"
                onClick={() => router.push(`/tournaments/${tournament.id}/edit`)}
                className="w-full"
              >
                Editar torneo
              </Button>

              {/* Botón Eliminar */}
              <Button
                variant="destructive"
                onClick={handleDeleteTournament}
                className="w-full"
              >
                Eliminar torneo
              </Button>
            </div>
          )}


        </div>
      </div>

      {/* Participants */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Participants</h3>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay participantes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {p.avatar_url && (
                  <img src={p.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm">{p.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Winner */}
      {tournament.is_finished && tournament.champion && (
        <div className="p-6 border-2 border-yellow-400 rounded-lg bg-yellow-100 text-center mt-8">
          <h3 className="text-2xl font-bold text-yellow-600 mb-2">Ganador del torneo</h3>
          <div className="flex flex-col items-center justify-center">
            {tournament.champion.avatar_url && (
              <img
                src={tournament.champion.avatar_url}
                alt={tournament.champion.username}
                className="w-16 h-16 rounded-full mb-2 border-2 border-yellow-500"
              />
            )}
            <p className="text-xl font-semibold">{tournament.champion.username}</p>
          </div>
        </div>
      )}

      {/* Bracket */}
      <div className="pt-10">
        <h3 className="text-xl font-semibold mb-2">Bracket</h3>

        {(matches?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Bracket aún no generado.</p>
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
                          <div className="space-y-3 border rounded p-3 bg-muted/30">
                          {/* Input para subir imagen */}
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Captura de partida (opcional)</p>

                            <label className="inline-block px-4 py-2 border rounded cursor-pointer text-sm bg-background hover:bg-muted transition">
                              Seleccionar imagen
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setScreenshotFiles((prev) => ({ ...prev, [match.id]: file }));
                                }}
                              />
                            </label>

                            {screenshotFiles[match.id] && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Archivo seleccionado: {screenshotFiles[match.id]?.name}
                              </p>
                            )}
                          </div>

                          {/* Botones para reportar resultado */}
                          <div className="flex gap-2 pt-2">
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
                        </div>

                      )}



                        {match.status === "completed" && match.winner && (
                          <>
                            <p className="text-green-600 text-sm font-medium">
                              Ganador: {getUsername(match.winner)}
                            </p>

                            {match.screenshot_url && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground mb-1">Captura de la partida:</p>
                                <img
                                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${match.screenshot_url}`}
                                  alt="Captura de la partida"
                                  className="w-full max-w-xs rounded border"
                                />
                              </div>
                            )}
                          </>
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