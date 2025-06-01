export interface Match {
    id: number;
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