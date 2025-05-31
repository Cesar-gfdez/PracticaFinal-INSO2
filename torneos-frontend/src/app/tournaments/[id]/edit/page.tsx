"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditTournamentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("single");
  const [type, setType] = useState("Individual");
  const [startTime, setStartTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [bannerURL, setBannerURL] = useState("");

  // Cargar torneo existente
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const t = data.tournament;
        setName(t.name);
        setGame(t.game);
        setPlatform(t.platform);
        setFormat(t.format);
        setType(t.type);
        setStartTime(t.start_time.slice(0, 16)); // Para input datetime-local
        setMaxParticipants(t.max_participants);
        setDescription(t.description || "");
        setRules(t.rules || []);
        setBannerURL(t.banner_url || "");
      })
      .catch((err) => {
        console.error("Error al cargar torneo:", err);
        alert("Error al cargar torneo.");
        router.push("/tournaments");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión.");
      return;
    }

    setSaving(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        game,
        platform,
        format,
        type,
        start_time: new Date(startTime).toISOString(),
        max_participants: maxParticipants,
        description,
        rules,
        banner_url: bannerURL,
      }),
    });

    if (res.ok) {
      alert("Torneo actualizado correctamente ✅");
      router.push(`/tournaments/${id}`);
    } else {
      const err = await res.json();
      alert(`Error al actualizar torneo: ${err.error}`);
    }

    setSaving(false);
  };

  if (loading) {
    return <p className="text-muted-foreground">Cargando torneo...</p>;
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">Editar Torneo</h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del torneo</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Juego</label>
          <Input value={game} onChange={(e) => setGame(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Plataforma</label>
          <Input value={platform} onChange={(e) => setPlatform(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Formato</label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Eliminación simple</SelectItem>
              <SelectItem value="double">Eliminación doble</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <Input value={type} onChange={(e) => setType(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha y hora de inicio</label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Máximo de participantes</label>
          <Input
            type="number"
            min={2}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reglas (separadas por coma)</label>
          <Input
            value={rules.join(", ")}
            onChange={(e) =>
              setRules(
                e.target.value
                  .split(",")
                  .map((r) => r.trim())
                  .filter((r) => r.length > 0)
              )
            }
          />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}