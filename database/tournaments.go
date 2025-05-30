package database

import (
	"context"
	"fmt"
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
		t.id, t.name, t.game, t.type, t.format, t.description, t.rules,
		t.platform, t.start_time, t.max_participants, t.banner_url,
		t.created_by_user_id, t.created_at, t.is_finished,
		u.id, u.username, u.avatar_url
	FROM tournaments t
	LEFT JOIN users u ON t.champion_id = u.id
	WHERE t.id = $1;
`

	var t models.Tournament
	var championID *int
	var championUsername, championAvatar *string

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
		&t.IsFinished,
		&championID,
		&championUsername,
		&championAvatar,
	)
	if err != nil {
		return nil, err
	}

	if championID != nil {
		t.Champion = &models.User{
			ID:        *championID,
			Username:  *championUsername,
			AvatarURL: *championAvatar,
		}
	}

	return &t, nil
}

func GetTournamentsSummary() ([]map[string]interface{}, error) {
	query := `
		SELECT 
	t.id, t.name, t.game, t.type, t.start_time,
	t.max_participants, t.banner_url, t.is_finished,
	COUNT(p.user_id) AS participants_count
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
			isFinished                             bool
		)

		err := rows.Scan(&id, &name, &game, &ttype, &startTime, &maxParticipants, &bannerURL, &isFinished, &participantsCount)
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
			"is_finished":        isFinished,
		})
	}

	return results, nil
}

func LeaveTournament(tournamentID, userID int) error {
	// Verificar que el torneo no tenga matches creados (bracket generado)
	var count int
	err := DB.QueryRow(context.Background(), `
		SELECT COUNT(*) FROM matches WHERE tournament_id = $1
	`, tournamentID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("no puedes darte de baja una vez generado el bracket")
	}

	// Verificar que el usuario está inscrito
	err = DB.QueryRow(context.Background(), `
		SELECT COUNT(*) FROM participants WHERE tournament_id = $1 AND user_id = $2
	`, tournamentID, userID).Scan(&count)
	if err != nil {
		return err
	}
	if count == 0 {
		return fmt.Errorf("no estás inscrito en este torneo")
	}

	// Eliminar su inscripción
	_, err = DB.Exec(context.Background(), `
		DELETE FROM participants WHERE tournament_id = $1 AND user_id = $2
	`, tournamentID, userID)
	return err
}
