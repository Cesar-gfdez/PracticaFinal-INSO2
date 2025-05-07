export interface Tournament {
    id: number;
    name: string;
    game: string;
    format: string;
    created_at: string;
  }
  
  export async function getTournamentById(id: number): Promise<Tournament> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tournaments/${id}`, {
      cache: "no-store",
    });
  
    if (!res.ok) {
      throw new Error("No se pudo cargar el torneo");
    }
  
    const data = await res.json();
    return data.tournament;
  }
