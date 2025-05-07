package models

import "time"

type Match struct {
    ID           int        `json:"id"`
    TournamentID int        `json:"tournament_id"`

    Round     int        `json:"round"`
    Status    string     `json:"status"`
    PlayedAt  *time.Time `json:"played_at,omitempty"`

    Player1ID *int   `json:"player1_id,omitempty"`
    Player2ID *int   `json:"player2_id,omitempty"`
    WinnerID  *int   `json:"winner_id,omitempty"`

    Player1 *User `json:"player1,omitempty" gorm:"foreignKey:Player1ID"`
    Player2 *User `json:"player2,omitempty" gorm:"foreignKey:Player2ID"`
    Winner  *User `json:"winner,omitempty" gorm:"foreignKey:WinnerID"`
}