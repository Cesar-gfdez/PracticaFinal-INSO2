package utils

import (
	"math"
	"torneos/models"
)

func GenerateBracket(players []string) []models.Match {
	var matches []models.Match
	matchID := 1
	numPlayers := len(players)

	// Rellenar con "BYE" si no es potencia de 2
	nextPower := int(math.Pow(2, math.Ceil(math.Log2(float64(numPlayers)))))
	for len(players) < nextPower {
		players = append(players, "BYE")
	}

	totalRounds := int(math.Log2(float64(len(players))))
	currentPlayers := players

	for round := 1; round <= totalRounds; round++ {
		var nextRoundPlayers []string
		for i := 0; i < len(currentPlayers); i += 2 {
			player1 := currentPlayers[i]
			player2 := currentPlayers[i+1]

			matches = append(matches, models.Match{
				ID:      matchID,
				Round:   round,
				Player1: player1,
				Player2: player2,
			})
			matchID++

			// para futuro avance automático, asumimos player1 pasa si player2 es BYE
			if player2 == "BYE" {
				nextRoundPlayers = append(nextRoundPlayers, player1)
			} else if player1 == "BYE" {
				nextRoundPlayers = append(nextRoundPlayers, player2)
			} else {
				nextRoundPlayers = append(nextRoundPlayers, "") // placeholder
			}
		}
		currentPlayers = nextRoundPlayers
	}

	return matches
}
