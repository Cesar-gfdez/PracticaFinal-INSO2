package models

import "time"

type Match struct {
	ID           int        `json:"id"`
	TournamentID int        `json:"tournament_id"`
	Round        int        `json:"round"`
	Player1ID    *int       `json:"player1_id,omitempty"`
	Player2ID    *int       `json:"player2_id,omitempty"`
	WinnerID     *int       `json:"winner_id,omitempty"`
	Status       string     `json:"status"`
	PlayedAt     *time.Time `json:"played_at,omitempty"`
}
