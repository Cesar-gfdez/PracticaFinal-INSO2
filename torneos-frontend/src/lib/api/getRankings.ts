export interface RankingUser {
<<<<<<< HEAD
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
=======
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
>>>>>>> 99649a26706743bc8fc65446359ad37a3aed5974
