package database

import (
	"context"
	"errors"
	"torneos/models"

	"github.com/jackc/pgconn"
)

func JoinTournament(userID int, tournamentID int) (*models.Participant, error) {
	query := `
        INSERT INTO participants (user_id, tournament_id)
        VALUES ($1, $2)
        RETURNING id, joined_at;
    `

	var p models.Participant
	err := DB.QueryRow(context.Background(), query, userID, tournamentID).
		Scan(&p.ID, &p.JoinedAt)

	if err != nil {
		// Check si ya existe (violación de UNIQUE)
		if isUniqueViolation(err) {
			return nil, errors.New("ya estás inscrito en este torneo")
		}
		return nil, err
	}

	p.UserID = userID
	p.TournamentID = tournamentID
	return &p, nil
}

func isUniqueViolation(err error) bool {
	if pgErr, ok := err.(*pgconn.PgError); ok {
		return pgErr.Code == "23505"
	}
	return false
}

func GetParticipantsByTournamentID(tournamentID int) ([]models.User, error) {
	query := `
        SELECT u.id, u.username, u.email, u.oauth_provider, u.oauth_id, u.avatar_url, u.created_at
        FROM participants p
        JOIN users u ON u.id = p.user_id
        WHERE p.tournament_id = $1;
    `

	rows, err := DB.Query(context.Background(), query, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.OAuthProvider, &u.OAuthID, &u.AvatarURL, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
