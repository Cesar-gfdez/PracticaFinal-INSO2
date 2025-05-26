package database

import (
	"context"
	"time"
	"torneos/models"
)

func CreateTournament(t *models.Tournament) (*models.Tournament, error) {
	query := `
		INSERT INTO tournaments (
			name, game, type, format, description, rules,
			platform, start_time, max_participants, banner_url,
			created_by_user_id, created_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10,
			$11, $12
		)
		RETURNING id, created_at;
	`

	err := DB.QueryRow(context.Background(), query,
		t.Name,
		t.Game,
		t.Type,
		t.Format,
		t.Description,
		t.Rules,
		t.Platform,
		t.StartTime,
		t.MaxParticipants,
		t.BannerURL,
		t.CreatedByUserID,
		t.CreatedAt,
	).Scan(&t.ID, &t.CreatedAt)

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

func GetTournamentByID(id int) (*models.Tournament, error) {
	query := `
		SELECT 
			id, name, game, type, format, description, rules,
			platform, start_time, max_participants, banner_url,
			created_by_user_id, created_at, champion_id
		FROM tournaments
		WHERE id = $1;
	`

	var t models.Tournament

	err := DB.QueryRow(context.Background(), query, id).Scan(
		&t.ID,
		&t.Name,
		&t.Game,
		&t.Type,
		&t.Format,
		&t.Description,
		&t.Rules,
		&t.Platform,
		&t.StartTime,
		&t.MaxParticipants,
		&t.BannerURL,
		&t.CreatedByUserID,
		&t.CreatedAt,
		&t.ChampionID,
	)

	if err != nil {
		return nil, err
	}
	return &t, nil
}

func GetTournamentsSummary() ([]map[string]interface{}, error) {
	query := `
		SELECT 
			t.id, t.name, t.game, t.type, t.start_time,
			t.max_participants, t.banner_url,
			COUNT(tp.user_id) AS participants_count
		FROM tournaments t
		LEFT JOIN participants p ON p.tournament_id = t.id

		GROUP BY t.id
		ORDER BY t.start_time ASC;
	`

	rows, err := DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var (
			id, maxParticipants, participantsCount int
			name, game, ttype, bannerURL           string
			startTime                              time.Time
		)

		err := rows.Scan(&id, &name, &game, &ttype, &startTime, &maxParticipants, &bannerURL, &participantsCount)
		if err != nil {
			return nil, err
		}

		results = append(results, map[string]interface{}{
			"id":                 id,
			"name":               name,
			"game":               game,
			"type":               ttype,
			"start_time":         startTime,
			"max_participants":   maxParticipants,
			"participants_count": participantsCount,
			"banner_url":         bannerURL,
		})
	}

	return results, nil
}
