export interface UserTournamentHistoryEntry {
  tournament_id: number;
  name: string;
  game: string;
  start_time: string;
  is_finished: boolean;
}

export async function getUserHistory(userId: number): Promise<UserTournamentHistoryEntry[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/history`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener historial de torneos");
  }

  return res.json();
}
