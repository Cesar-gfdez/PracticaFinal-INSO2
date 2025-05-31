"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, User } from "@/lib/api/getUser";
import { getUserHistory, UserTournamentHistoryEntry } from "@/lib/api/getUserHistory";
import { getUserMatches, UserMatchEntry } from "@/lib/api/getUserMatches";
import { Input } from "@/components/ui/input";


export default function ProfilePage() {
  const { userId } = useUser();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<UserTournamentHistoryEntry[]>([]);
  const [matches, setMatches] = useState<UserMatchEntry[]>([]);
  const [twitch, setTwitch] = useState<string>("");
  const [youtube, setYouTube] = useState<string>("");

  useEffect(() => {
    if (!userId) return;

    // Cargar datos del perfil
    getUser(userId).then(setUser);

    // Cargar historial de torneos
    getUserHistory(userId)
      .then(setHistory)
      .catch((err) => console.error("Error al cargar historial de torneos:", err));

    // Cargar historial de matches
    getUserMatches(userId)
      .then(setMatches)
      .catch((err) => console.error("Error al cargar matches:", err));
  }, [userId]);

  useEffect(() => {
  if (user) {
    setTwitch(user.twitch || "");
    setYouTube(user.youtube || "");
  }
}, [user]);

  // Función para guardar redes sociales
  const handleSaveSocials = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión.");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/socials`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        twitch: twitch.trim() || null,
        youtube: youtube.trim() || null,
      }),
    });

    if (res.ok) {
      alert("Redes sociales actualizadas correctamente ✅");
    } else {
      const err = await res.json();
      alert(`Error al actualizar redes sociales: ${err.error}`);
    }
  };
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h2 className="text-3xl font-bold mb-4">Tu perfil</h2>

      {!userId ? (
        <p className="text-muted-foreground">No has iniciado sesión.</p>
      ) : !user ? (
        <p className="text-sm text-muted-foreground">Cargando usuario...</p>
      ) : (
        <div className="space-y-6">
          {/* Perfil */}
          <div className="flex items-center gap-6">
            <img
              src={user.avatar_url}
              alt="Avatar"
              className="w-20 h-20 rounded-full"
            />
            <div>
              <p className="text-lg">
                Nombre: <strong>{user.username}</strong>
              </p>
              <p>ID: {user.id}</p>
            </div>
          </div>

          <Button variant="destructive" onClick={handleLogout}>
            Cerrar sesión
          </Button>

          {/* Historial de torneos */}
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Historial de torneos</h3>
            {history.length === 0 ? (
              <p className="text-muted-foreground">Aún no has jugado ningún torneo.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((entry) => (
                  <li
                    key={entry.tournament_id}
                    className="p-3 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{entry.name} ({entry.game})</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.start_time).toLocaleString()} —{" "}
                        {entry.is_finished ? "Finalizado" : "En curso"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          

          {/* Historial de matches */}
          <div className="space-y-2 pt-6">
            <h3 className="text-2xl font-semibold">Historial de matches</h3>
            {matches.length === 0 ? (
              <p className="text-muted-foreground">Aún no has jugado ningún match.</p>
            ) : (
              <ul className="space-y-2">
                {matches.map((match) => (
                  <li
                    key={match.match_id}
                    className="p-3 border rounded-lg flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium">
                        Torneo #{match.tournament_id} — Ronda {match.round}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {match.status}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>
                        Rival: {match.opponent || "Desconocido"}
                      </span>
                      <span>
                        {match.played_at
                          ? new Date(match.played_at).toLocaleString()
                          : "Sin fecha"}
                      </span>
                    </div>
                    {match.status === "completed" && (
                      <p className="mt-1 text-green-600 text-sm">
                        {match.winner_id === userId
                          ? "Ganaste este match ✅"
                          : "Perdiste este match ❌"}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Redes sociales */}
          <div className="space-y-2 pt-6">
            <h3 className="text-2xl font-semibold">Redes sociales</h3>

            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Twitch</label>
                <Input
                  type="text"
                  value={twitch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwitch(e.target.value)}
                  placeholder="Tu canal de Twitch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">YouTube</label>
                <Input
                  type="text"
                  value={youtube}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYouTube(e.target.value)}
                  placeholder="Tu canal de YouTube"
                />
              </div>

              <Button onClick={handleSaveSocials} className="mt-2">
                Guardar redes sociales
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}