"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  user_id: number;
  exp: number;
  iat: number;
}

export function useUser() {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        localStorage.removeItem("token");
        return;
      }

      setUserId(decoded.user_id);
    } catch (error) {
      console.error("Token inválido:", error);
      localStorage.removeItem("token");
    }
  }, []);

  return { userId };
}
