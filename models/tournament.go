package models

import "time"

type Tournament struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	Game            string    `json:"game"`
	Type            string    `json:"type"`
	Description     string    `json:"description"`
	Rules           []string  `json:"rules"`
	Platform        string    `json:"platform"`
	StartTime       time.Time `json:"start_time"`
	MaxParticipants int       `json:"max_participants"`
	BannerURL       string    `json:"banner_url"`
	Format          string    `json:"format"`
	CreatedByUserID int       `json:"created_by_user_id"`
	CreatedAt       time.Time `json:"created_at"`
	ChampionID      *int      `json:"champion_id,omitempty"`
	Champion        *User     `json:"champion,omitempty"`
	IsFinished      bool      `json:"is_finished"`
}

type CreateTournamentRequest struct {
	Name            string   `json:"name"`
	Game            string   `json:"game"`
	Type            string   `json:"type"`
	Description     string   `json:"description"`
	Rules           []string `json:"rules"`
	Platform        string   `json:"platform"`
	StartTime       string   `json:"start_time"`
	MaxParticipants int      `json:"max_participants"`
	BannerURL       string   `json:"banner_url"`
	Format          string   `json:"format"`
}
