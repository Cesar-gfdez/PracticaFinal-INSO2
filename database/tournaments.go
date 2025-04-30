package database

import (
	"context"
	"torneos/models"
)

func CreateTournament(t *models.Tournament) (*models.Tournament, error) {
	query := `
        INSERT INTO tournaments (name, game, format, created_by_user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at;
    `

	err := DB.QueryRow(context.Background(), query,
		t.Name, t.Game, t.Format, t.CreatedByUserID).
		Scan(&t.ID, &t.CreatedAt)

	if err != nil {
		return nil, err
	}
	return t, nil
}

func GetAllTournaments() ([]models.Tournament, error) {
	query := `
        SELECT id, name, game, format, created_by_user_id, created_at
        FROM tournaments
        ORDER BY created_at DESC;
    `

	rows, err := DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tournaments []models.Tournament
	for rows.Next() {
		var t models.Tournament
		err := rows.Scan(&t.ID, &t.Name, &t.Game, &t.Format, &t.CreatedByUserID, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		tournaments = append(tournaments, t)
	}

	return tournaments, nil
}
