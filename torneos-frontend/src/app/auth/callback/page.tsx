"use client";

import  {useEffect}  from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      router.push("/profile");
    } else {
      // Si no hay token, redirige a login
      router.push("/");
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground text-sm">Procesando autenticación...</p>
    </div>
  );
}
