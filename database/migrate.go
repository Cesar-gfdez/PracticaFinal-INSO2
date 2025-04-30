package database

import (
    "context"
    "fmt"
    "os"
)

func RunMigrations() error {
    sql, err := os.ReadFile("migrations/001_create_users.sql")
    if err != nil {
        return fmt.Errorf("error leyendo script SQL: %w", err)
    }

    _, err = DB.Exec(context.Background(), string(sql))
    if err != nil {
        return fmt.Errorf("error ejecutando migración: %w", err)
    }

    fmt.Println("Migración ejecutada correctamente")
    return nil
}
