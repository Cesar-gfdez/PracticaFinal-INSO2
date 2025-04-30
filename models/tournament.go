package models

import "time"

type Tournament struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	Game            string    `json:"game"`
	Format          string    `json:"format"`
	CreatedByUserID int       `json:"created_by_user_id"`
	CreatedAt       time.Time `json:"created_at"`
}
