"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

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
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const isAlreadyJoined = userId && participants.some((p) => p.id === userId);
  const isCreator = userId === tournament?.created_by_user_id;

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
    } else {
      const err = await res.json();
      alert(`Error al generar bracket: ${err.error}`);
    }

    setGenerating(false);
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
            disabled={generating}
          >
            {generating ? "Generando..." : "Generar bracket"}
          </Button>
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
    </div>
  );
}
