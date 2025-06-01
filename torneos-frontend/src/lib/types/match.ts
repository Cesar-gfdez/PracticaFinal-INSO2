export interface Match {
  id: number;
  round: number;
  status: string;
  player1?: {
    id: number;
<<<<<<< HEAD
    round: number;
    status: string;
    player1?: {
      id: number;
      username: string;
    };
    player2?: {
      id: number;
      username: string;
    };
    winner?: {
      id: number;
      username: string;
    };
    screenshot_url?: string | null;
  }
=======
    username: string;
  };
  player2?: {
    id: number;
    username: string;
  };
  winner?: {
    id: number;
    username: string;
  };
  screenshot_url?: string | null;
}
>>>>>>> 99649a26706743bc8fc65446359ad37a3aed5974
