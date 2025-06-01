import { useEffect, useRef } from "react";

export function useWebSocket(path: string, onMessage: (msg: string) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^http/, "ws")}${path}`;
    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Conectado a", wsUrl);
    };

    ws.onmessage = (event) => {
      console.log("[WebSocket] Mensaje recibido:", event.data);
      onMessage(event.data);
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Error:", err);
    };

    ws.onclose = () => {
      console.log("[WebSocket] Desconectado");
    };

    // Limpieza
    return () => {
      ws.close();
    };
  }, [path, onMessage]);
}
