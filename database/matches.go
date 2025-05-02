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

func GetFullBracket(tournamentID int) ([]map[string]interface{}, error) {
    query := `
        SELECT 
            m.id, m.round, 
            u1.username AS player1, 
            u2.username AS player2, 
            uw.username AS winner, 
            m.status, m.played_at
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
        var id, round int
        var player1, player2, winner *string
        var status string
        var playedAt *time.Time

        err := rows.Scan(&id, &round, &player1, &player2, &winner, &status, &playedAt)
        if err != nil {
            return nil, err
        }

        result = append(result, map[string]interface{}{
            "id":       id,
            "round":    round,
            "player1":  nullToEmpty(player1),
            "player2":  nullToEmpty(player2),
            "winner":   nullToEmpty(winner),
            "status":   status,
            "playedAt": playedAt,
        })
    }

    return result, nil
}

func nullToEmpty(s *string) string {
    if s == nil {
        return ""
    }
    return *s
}