package database

import (
	"context"
	"errors"
	"time"
	"torneos/models"
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
    query := `
        UPDATE matches
        SET winner_id = $1, status = 'completed', played_at = NOW()
        WHERE id = $2 AND (player1_id = $3 OR player2_id = $3);
    `

    cmd, err := DB.Exec(context.Background(), query, winnerID, matchID, reporterID)
    if err != nil {
        return err
    }

    if cmd.RowsAffected() == 0 {
        return errors.New("no tienes permiso para reportar este match o no existe")
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
			id, round       int
			status          string
			playedAt        *time.Time
			p1ID, p2ID      *int
			p1Username      *string
			p2Username      *string
			winnerID        *int
			winnerUsername  *string
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
			"id":     id,
			"round":  round,
			"status": status,
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
