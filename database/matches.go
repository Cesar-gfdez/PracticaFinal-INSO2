package database

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
	"torneos/models"
	"torneos/realtime"

	"github.com/gin-gonic/gin"
)

func InsertMatch(m *models.Match) (*models.Match, error) {
	query := `
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, played_at;
    `

	err := DB.QueryRow(context.Background(), query,
		m.TournamentID,
		m.Round,
		m.Player1ID,
		m.Player2ID,
		m.Status,
	).Scan(&m.ID, &m.PlayedAt)

	if err != nil {
		return nil, err
	}
	return m, nil
}

func GetMatchesByTournamentID(tournamentID int) ([]models.Match, error) {
	query := `
        SELECT id, tournament_id, round, player1_id, player2_id, winner_id, status, played_at
        FROM matches
        WHERE tournament_id = $1
        ORDER BY round, id;
    `

	rows, err := DB.Query(context.Background(), query, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		var m models.Match
		err := rows.Scan(
			&m.ID,
			&m.TournamentID,
			&m.Round,
			&m.Player1ID,
			&m.Player2ID,
			&m.WinnerID,
			&m.Status,
			&m.PlayedAt,
		)
		if err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	return matches, nil
}

func ReportMatchResult(matchID, reporterID, winnerID int) error {
	// 1. Verificar que el match no esté ya completado
	var status string
	var tournamentID int
	var player1ID, player2ID int

	err := DB.QueryRow(context.Background(), `
		SELECT status, tournament_id, COALESCE(player1_id, 0), COALESCE(player2_id, 0)
		FROM matches
		WHERE id = $1
	`, matchID).Scan(&status, &tournamentID, &player1ID, &player2ID)
	if err != nil {
		return err
	}

	if status != "pending" {
		return errors.New("el resultado ya fue reportado")
	}

	// 2. Verificar si el reportero es jugador o creador del torneo
	var createdBy int
	err = DB.QueryRow(context.Background(), `
		SELECT created_by_user_id FROM tournaments WHERE id = $1
	`, tournamentID).Scan(&createdBy)
	if err != nil {
		return err
	}

	if reporterID != player1ID && reporterID != player2ID && reporterID != createdBy {
		return errors.New("no tienes permiso para reportar este match")
	}

	// 3. Actualizar el match
	query := `
        UPDATE matches
        SET winner_id = $1, status = 'completed', played_at = NOW()
        WHERE id = $2
    `
	_, err = DB.Exec(context.Background(), query, winnerID, matchID)
	if err != nil {
		return err
	}

	// 4. Avanzar automáticamente al ganador a la siguiente ronda
	err = AdvanceWinnerToNextRound(matchID, winnerID)
	if err != nil {
		return fmt.Errorf("el resultado fue registrado pero no se pudo avanzar al siguiente match: %v", err)
	}

	return nil
}

func GetMatchesWithPlayers(tournamentID int) ([]map[string]interface{}, error) {
	query := `
        SELECT 
            m.id, m.round, m.status, m.played_at,
            u1.id AS p1_id, u1.username AS p1_username,
            u2.id AS p2_id, u2.username AS p2_username,
            uw.id AS winner_id, uw.username AS winner_username
        FROM matches m
        LEFT JOIN users u1 ON m.player1_id = u1.id
        LEFT JOIN users u2 ON m.player2_id = u2.id
        LEFT JOIN users uw ON m.winner_id = uw.id
        WHERE m.tournament_id = $1
        ORDER BY m.round, m.id;
    `

	rows, err := DB.Query(context.Background(), query, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var (
			id, round      int
			status         string
			playedAt       *time.Time
			p1ID, p2ID     *int
			p1Username     *string
			p2Username     *string
			winnerID       *int
			winnerUsername *string
		)

		err := rows.Scan(
			&id, &round, &status, &playedAt,
			&p1ID, &p1Username,
			&p2ID, &p2Username,
			&winnerID, &winnerUsername,
		)
		if err != nil {
			return nil, err
		}

		result = append(result, map[string]interface{}{
			"id":       id,
			"round":    round,
			"status":   status,
			"playedAt": playedAt,
			"player1": map[string]interface{}{
				"id":       nullInt(p1ID),
				"username": nullString(p1Username),
			},
			"player2": map[string]interface{}{
				"id":       nullInt(p2ID),
				"username": nullString(p2Username),
			},
			"winner": map[string]interface{}{
				"id":       nullInt(winnerID),
				"username": nullString(winnerUsername),
			},
		})
	}

	return result, nil
}

func nullInt(i *int) interface{} {
	if i == nil {
		return nil
	}
	return *i
}

func nullString(s *string) interface{} {
	if s == nil {
		return nil
	}
	return *s
}

func AdvanceWinnerToNextRound(matchID, winnerID int) error {
	// 1. Obtener torneo y ronda del match actual
	var tournamentID, round int
	err := DB.QueryRow(context.Background(), `
        SELECT tournament_id, round
        FROM matches
        WHERE id = $1
    `, matchID).Scan(&tournamentID, &round)

	if err != nil {
		return err
	}

	nextRound := round + 1

	// 2. Verificar si ya no quedan más matches pendientes en la ronda actual
	var pendingCount int
	err = DB.QueryRow(context.Background(), `
        SELECT COUNT(*)
        FROM matches
        WHERE tournament_id = $1 AND round = $2 AND status != 'completed'
    `, tournamentID, round).Scan(&pendingCount)
	if err != nil {
		return err
	}

	// 3. Verificar si ya existe algún match en la siguiente ronda
	var nextRoundCount int
	err = DB.QueryRow(context.Background(), `
        SELECT COUNT(*)
        FROM matches
        WHERE tournament_id = $1 AND round = $2
    `, tournamentID, nextRound).Scan(&nextRoundCount)
	if err != nil {
		return err
	}

	if pendingCount == 0 && nextRoundCount == 0 {
		// Registrar el campeón y marcar como finalizado
		_, err := DB.Exec(context.Background(), `
            UPDATE tournaments
            SET champion_id = $1, is_finished = TRUE
            WHERE id = $2
        `, winnerID, tournamentID)
		if err != nil {
			return fmt.Errorf("no se pudo registrar al campeón ni finalizar el torneo: %v", err)
		}

		// Sumar +50 puntos al ganador
		_, err = DB.Exec(context.Background(), `
            UPDATE users
            SET points = points + 50
            WHERE id = $1
        `, winnerID)
		if err != nil {
			return fmt.Errorf("no se pudo actualizar los puntos del ganador: %v", err)
		}

		// Obtener subcampeón (jugador que perdió la final)
		var player1ID, player2ID int
		err = DB.QueryRow(context.Background(), `
            SELECT COALESCE(player1_id, 0), COALESCE(player2_id, 0)
            FROM matches
            WHERE id = $1
        `, matchID).Scan(&player1ID, &player2ID)
		if err != nil {
			return fmt.Errorf("no se pudo obtener los jugadores de la final: %v", err)
		}

		var runnerUpID int
		if player1ID != winnerID && player1ID != 0 {
			runnerUpID = player1ID
		} else if player2ID != winnerID && player2ID != 0 {
			runnerUpID = player2ID
		}

		if runnerUpID != 0 {
			// Sumar +30 puntos al subcampeón
			_, err = DB.Exec(context.Background(), `
                UPDATE users
                SET points = points + 30
                WHERE id = $1
            `, runnerUpID)
			if err != nil {
				return fmt.Errorf("no se pudo actualizar los puntos del subcampeón: %v", err)
			}
		}

		// Emitir notificación de torneo finalizado
		realtime.Broadcast(fmt.Sprintf(
			"EVENT:WINNER|TOURNAMENT:%d|WINNER_ID:%d|MESSAGE:Torneo finalizado",
			tournamentID, winnerID,
		))

		return nil
	}

	// 4. Verificar si el jugador ya está en un match de la siguiente ronda
	var exists int
	err = DB.QueryRow(context.Background(), `
        SELECT COUNT(*)
        FROM matches
        WHERE tournament_id = $1 AND round = $2 AND (player1_id = $3 OR player2_id = $3)
    `, tournamentID, nextRound, winnerID).Scan(&exists)
	if err != nil {
		return err
	}

	if exists > 0 {
		// El jugador ya está en la siguiente ronda → no hacer nada
		return nil
	}

	// 5. Buscar matches con hueco en la siguiente ronda
	rows, err := DB.Query(context.Background(), `
        SELECT id, player1_id, player2_id
        FROM matches
        WHERE tournament_id = $1 AND round = $2
        ORDER BY id
    `, tournamentID, nextRound)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var matchID int
		var p1ID, p2ID *int

		if err := rows.Scan(&matchID, &p1ID, &p2ID); err != nil {
			return err
		}

		if p1ID == nil {
			_, err := DB.Exec(context.Background(), `
                UPDATE matches SET player1_id = $1 WHERE id = $2
            `, winnerID, matchID)
			return err
		}
		if p2ID == nil {
			_, err := DB.Exec(context.Background(), `
                UPDATE matches SET player2_id = $1 WHERE id = $2
            `, winnerID, matchID)
			return err
		}
	}

	// 6. Si no hay match con hueco, crear uno nuevo
	_, err = DB.Exec(context.Background(), `
        INSERT INTO matches (tournament_id, round, player1_id, status)
        VALUES ($1, $2, $3, 'pending')
    `, tournamentID, nextRound, winnerID)

	return err
}

func UploadMatchScreenshot(c *gin.Context) {
	// Obtener el ID del match
	matchIDStr := c.Param("id")
	matchID, err := strconv.Atoi(matchIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	// Leer el archivo del formulario (campo "file")
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Crear carpeta uploads si no existe
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, os.ModePerm)
	}

	// Construir path del archivo
	filename := fmt.Sprintf("match_%d_%s", matchID, filepath.Base(file.Filename))
	filePath := filepath.Join(uploadDir, filename)

	// Guardar archivo
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Guardar ruta en la base de datos
	relativePath := "/uploads/" + filename
	updateQuery := `
        UPDATE matches
        SET screenshot_url = $1
        WHERE id = $2
    `
	_, err = DB.Exec(context.Background(), updateQuery, relativePath, matchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update match"})
		return
	}

	// Responder OK
	c.JSON(http.StatusOK, gin.H{
		"message":        "Screenshot uploaded successfully",
		"screenshot_url": relativePath,
	})
}
