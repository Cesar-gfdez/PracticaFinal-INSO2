export interface Tournament {
  id: number;
  name: string;
  game: string;
  format: string;
  platform: string;
  start_time: string; // ISO string
  max_participants: number;
  banner_url: string | null;
  is_finished: boolean;
  champion_id: number | null;
  created_at: string;
}

export async function getTournaments(): Promise<Tournament[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener torneos");
  }

  return res.json();
}