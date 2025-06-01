"use client";

import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { toast } from "sonner";

export function WebSocketListener() {
  useWebSocket("/ws", (msg) => {
  console.log("[WebSocket] Mensaje recibido:", msg);

  const parts = msg.split("|").reduce((acc, part) => {
    const [key, value] = part.split(":");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);

  const event = parts["EVENT"];
  const tournamentId = parseInt(parts["TOURNAMENT"] || "0");

  console.log("[WebSocket] Event:", event, "Tournament:", tournamentId);

  // Mostrar toast según EVENT
  if (event === "BRACKET") {
    toast.success("¡Se ha generado un bracket!");
  } else if (event === "RESULT" || event === "MATCH_RESULT") {
    toast.success("¡Se ha reportado un resultado!");
  } else if (event === "WINNER") {
    setTimeout(() => {
        toast.success("¡El torneo ha finalizado!");
    }, 1000);
    setTimeout(() => {
        window.location.reload();
    }, 2000);
  } else {
    console.log("[WebSocket] Evento desconocido:", msg);
  }
});
    return null;
}
