export interface UserMatchEntry {
  match_id: number;
  tournament_id: number;
  round: number;
  status: string;
  played_at: string | null;
  opponent: string | null;
  winner_id: number | null;
}

export async function getUserMatches(userId: number): Promise<UserMatchEntry[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/matches`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener matches del usuario");
  }

  return res.json();
<<<<<<< HEAD
}
=======
}
>>>>>>> 99649a26706743bc8fc65446359ad37a3aed5974
