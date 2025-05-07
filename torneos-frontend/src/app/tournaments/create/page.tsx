"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateTournamentPage() {
  const userId = useAuthStore((state) => state.userId);
  const router = useRouter();

  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [format, setFormat] = useState("single"); // default

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, game, format }),
    });

    if (res.ok) {
      router.push("/tournaments");
    } else {
      console.error("Error al crear torneo");
    }
  };

  if (!userId) {
    return <p className="text-muted-foreground">Debes iniciar sesión para crear un torneo.</p>;
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">Crear Torneo</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nombre del torneo</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <Label>Juego</Label>
          <Input value={game} onChange={(e) => setGame(e.target.value)} required />
        </div>

        <div>
          <Label>Formato</Label>
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

        <Button type="submit" className="w-full">Crear Torneo</Button>
      </form>
    </div>
  );
}