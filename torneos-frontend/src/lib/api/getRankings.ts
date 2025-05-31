export interface RankingUser {
    id: number;
    username: string;
    points: number;
  }
  
  export async function getRankings(): Promise<RankingUser[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ranking`, {
      cache: "no-store",
    });
  
    if (!res.ok) {
      throw new Error("Error al obtener ranking");
    }
  
    return res.json();
  }