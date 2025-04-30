package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

// ConnectDatabase abre la conexión a PostgreSQL
func ConnectDatabase() error {
	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		return fmt.Errorf("DATABASE_URL no definida en las variables de entorno")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseUrl)
	if err != nil {
		return fmt.Errorf("error creando el pool de conexiones: %w", err)
	}

	err = pool.Ping(ctx)
	if err != nil {
		return fmt.Errorf("error al hacer ping a la base de datos: %w", err)
	}

	DB = pool
	fmt.Println("Conectado correctamente a PostgreSQL")
	return nil
}

// CloseDatabase cierra la conexión cuando la app se apaga
func CloseDatabase() {
	if DB != nil {
		DB.Close()
	}
}
