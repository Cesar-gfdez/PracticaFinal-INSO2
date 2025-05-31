package database

import (
	"context"
	"time"
	"torneos/models"
)

func GetAllUsers() ([]models.User, error) {
	rows, err := DB.Query(context.Background(), "SELECT id, username, email, oauth_provider, oauth_id, avatar_url, created_at FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User

	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.OAuthProvider, &u.OAuthID, &u.AvatarURL, &u.CreatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, nil
}

// Buscar por oauth_provider + oauth_id
func FindUserByOAuth(provider, oauthID string) (*models.User, error) {
	var user models.User
	err := DB.QueryRow(context.Background(),
		`SELECT id, username, email, oauth_provider, oauth_id, avatar_url, created_at
		 FROM users WHERE oauth_provider=$1 AND oauth_id=$2`,
		provider, oauthID).
		Scan(&user.ID, &user.Username, &user.Email, &user.OAuthProvider, &user.OAuthID, &user.AvatarURL, &user.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &user, nil
}

func CreateUser(u *models.User) (*models.User, error) {
	err := DB.QueryRow(context.Background(),
		`INSERT INTO users (username, email, oauth_provider, oauth_id, avatar_url)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at`,
		u.Username, u.Email, u.OAuthProvider, u.OAuthID, u.AvatarURL).
		Scan(&u.ID, &u.CreatedAt)

	if err != nil {
		return nil, err
	}
	return u, nil
}

func GetUserByID(id int) (*models.User, error) {
	var user models.User
	err := DB.QueryRow(context.Background(),
		`SELECT id, username, email, oauth_provider, oauth_id, avatar_url, created_at
		 FROM users WHERE id=$1`, id).
		Scan(&user.ID, &user.Username, &user.Email, &user.OAuthProvider, &user.OAuthID, &user.AvatarURL, &user.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetRankingTop(limit int) ([]map[string]interface{}, error) {
	rows, err := DB.Query(context.Background(), `
        SELECT id, username, points
        FROM users
        ORDER BY points DESC
        LIMIT $1
    `, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ranking []map[string]interface{}

	for rows.Next() {
		var id int
		var username string
		var points int

		if err := rows.Scan(&id, &username, &points); err != nil {
			return nil, err
		}

		ranking = append(ranking, map[string]interface{}{
			"id":       id,
			"username": username,
			"points":   points,
		})
	}

	return ranking, nil
}

func GetUserTournamentHistory(userID int) ([]map[string]interface{}, error) {
	rows, err := DB.Query(context.Background(), `
        SELECT t.id, t.name, t.game, t.start_time, t.is_finished
        FROM participants p
        JOIN tournaments t ON p.tournament_id = t.id
        WHERE p.user_id = $1
        ORDER BY t.start_time DESC
    `, userID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []map[string]interface{}

	for rows.Next() {
		var tournamentID int
		var name string
		var game string
		var startTime time.Time
		var isFinished bool

		if err := rows.Scan(&tournamentID, &name, &game, &startTime, &isFinished); err != nil {
			return nil, err
		}

		history = append(history, map[string]interface{}{
			"tournament_id": tournamentID,
			"name":          name,
			"game":          game,
			"start_time":    startTime,
			"is_finished":   isFinished,
		})
	}

	return history, nil
}

func GetUserMatches(userID int) ([]map[string]interface{}, error) {
	rows, err := DB.Query(context.Background(), `
        SELECT 
            m.id, m.tournament_id, m.round, m.status, m.played_at, 
            CASE 
                WHEN m.player1_id = $1 THEN u2.username
                WHEN m.player2_id = $1 THEN u1.username
                ELSE NULL
            END AS opponent_username,
            m.winner_id
        FROM matches m
        LEFT JOIN users u1 ON m.player1_id = u1.id
        LEFT JOIN users u2 ON m.player2_id = u2.id
        WHERE m.player1_id = $1 OR m.player2_id = $1
        ORDER BY m.played_at DESC NULLS LAST, m.id DESC
    `, userID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []map[string]interface{}

	for rows.Next() {
		var matchID int
		var tournamentID int
		var round int
		var status string
		var playedAt *time.Time
		var opponentUsername *string
		var winnerID *int

		if err := rows.Scan(&matchID, &tournamentID, &round, &status, &playedAt, &opponentUsername, &winnerID); err != nil {
			return nil, err
		}

		matches = append(matches, map[string]interface{}{
			"match_id":      matchID,
			"tournament_id": tournamentID,
			"round":         round,
			"status":        status,
			"played_at":     playedAt,
			"opponent":      nullString(opponentUsername),
			"winner_id":     nullInt(winnerID),
		})
	}

	return matches, nil
}
