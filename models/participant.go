package models

import "time"

type Participant struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	TournamentID int       `json:"tournament_id"`
	JoinedAt     time.Time `json:"joined_at"`
}
