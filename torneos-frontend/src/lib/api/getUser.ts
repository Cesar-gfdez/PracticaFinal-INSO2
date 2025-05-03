import axios from "axios";

export interface User {
  id: number;
  username: string;
  avatar_url: string;
}

export async function getUser(id: number): Promise<User | null> {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    return null;
  }
}
