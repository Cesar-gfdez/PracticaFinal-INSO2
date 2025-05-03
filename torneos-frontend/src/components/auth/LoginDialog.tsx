"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LoginDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogIn className="w-4 h-4 mr-2" />
          Iniciar sesión
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inicia sesión</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/discord/login`;
            }}
          >
            Discord
          </Button>

          {}
        </div>
      </DialogContent>
    </Dialog>
  );
}