"use client";

import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "@/store/useAuthStore";

interface DecodedToken {
  user_id: number;
  exp: number;
  iat: number;
}

export default function SessionHandler() {
  const setUserId = useAuthStore((state) => state.setUserId);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        localStorage.setItem("token", token);
        setUserId(decoded.user_id);

        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
      } catch (e) {
        console.error("Token inválido:", e);
      }
    } else {
      const localToken = localStorage.getItem("token");
      if (localToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(localToken);
          setUserId(decoded.user_id);
        } catch (e) {
          console.error("Token inválido en localStorage:", e);
        }
      }
    }
  }, [setUserId]);

  return null;
}