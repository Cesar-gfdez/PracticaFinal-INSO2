package database

import (
    "context"
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

