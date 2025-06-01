"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gameImages } from "@/lib/gameImages";

export default function CreateTournamentPage() {
  const userId = useAuthStore((state) => state.userId);
  const router = useRouter();

  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [platform, setPlatform] = useState("");
  const [startTime, setStartTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [format, setFormat] = useState("single");
  const [type, setType] = useState("Individual"); // como tienes en backend
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    const banner_url = gameImages[game] || "/images/default.jpg";

    const parsedRules = rules
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    console.log({
      name,
      game,
      platform,
      start_time: new Date(startTime).toISOString(),
      max_participants: maxParticipants,
      format,
      banner_url,
      type,
      description: description || null,
      rules: parsedRules,
    });

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          game,
          platform,
          start_time: new Date(startTime).toISOString(),
          max_participants: maxParticipants,
          format,
          banner_url,
          type,
          description: description || null,
          rules: parsedRules,
        }),
      }
    );

    if (res.ok) {
      router.push("/tournaments");
    } else {
      console.error("Error al crear torneo");
    }
  };

  if (!userId) {
    return (
      <p className="text-muted-foreground">
        Debes iniciar sesión para crear un torneo.
      </p>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">Crear Torneo</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nombre del torneo</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Juego</Label>
          <Select value={game} onValueChange={setGame}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un juego" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CS2">CS2</SelectItem>
              <SelectItem value="League of Legends">League of Legends</SelectItem>
              <SelectItem value="Valorant">Valorant</SelectItem>
              <SelectItem value="Rocket League">Rocket League</SelectItem>
              <SelectItem value="Fortnite">Fortnite</SelectItem>
              <SelectItem value="Call of Duty: Warzone">Call of Duty: Warzone</SelectItem>
              <SelectItem value="EA FC 25">EA FC 25</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Plataforma</Label>
          <Input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Ej: PC, PS5, Xbox..."
            required
          />
        </div>

        <div>
          <Label>Fecha y hora de inicio</Label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Máximo de participantes</Label>
          <Input
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
            min={2}
            required
          />
        </div>

        <div>
          <Label>Formato</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Eliminación simple</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de torneo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="TEAM">Por equipos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Descripción (opcional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción del torneo"
          />
        </div>

        <div>
          <Label>Reglas (separadas por comas)</Label>
          <Input
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Ej: Regla1, Regla2, Regla3"
          />
        </div>

        <Button type="submit" className="w-full">
          Crear Torneo
        </Button>
      </form>
    </div>
  );
}
