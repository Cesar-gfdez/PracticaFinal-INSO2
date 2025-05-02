package models

type Match struct {
	ID      int    `json:"id"`
	Round   int    `json:"round"`
	Player1 string `json:"player1"`
	Player2 string `json:"player2"`
}
