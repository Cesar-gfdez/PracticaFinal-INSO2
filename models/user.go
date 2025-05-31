package models

import "time"

type User struct {
	ID            int       `json:"id"`
	Username      string    `json:"username"`
	Email         string    `json:"email"`
	OAuthProvider string    `json:"oauth_provider"`
	OAuthID       string    `json:"oauth_id"`
	AvatarURL     string    `json:"avatar_url"`
	CreatedAt     time.Time `json:"created_at"`
	Twitch        *string   `json:"twitch"`
	YouTube       *string   `json:"youtube"`
}
