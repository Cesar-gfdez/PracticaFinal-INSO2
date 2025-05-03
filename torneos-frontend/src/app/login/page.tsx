"use client";

import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/discord/login`;
  }, []);

  return <p className="text-center mt-10">Redirigiendo a Discord...</p>;
}