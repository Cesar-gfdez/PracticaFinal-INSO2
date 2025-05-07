export interface Tournament {
    id: number;
    name: string;
    game: string;
    format: string;
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