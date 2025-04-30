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