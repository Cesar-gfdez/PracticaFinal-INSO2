"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, User } from "@/lib/api/getUser";

export default function ProfilePage() {
  const { userId } = useUser();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!userId) return;
    getUser(userId).then(setUser);
  }, [userId]);

  const handleLogout = () => {
    logout();     
    router.push("/"); 
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">Tu perfil</h2>

      {!userId ? (
        <p className="text-muted-foreground">No has iniciado sesión.</p>
      ) : !user ? (
        <p className="text-sm text-muted-foreground">Cargando usuario...</p>
      ) : (
        <div className="space-y-4">
          <img
            src={user.avatar_url}
            alt="Avatar"
            className="w-20 h-20 rounded-full"
          />
          <p className="text-lg">Nombre: <strong>{user.username}</strong></p>
          <p>ID: {user.id}</p>
          <Button variant="destructive" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      )}
    </div>
  );
}