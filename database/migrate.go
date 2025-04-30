package database

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"sort"
)

func RunMigrations() error {
	files, err := ioutil.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("error leyendo la carpeta de migraciones: %w", err)
	}

	// Ordenar por nombre
	sort.Slice(files, func(i, j int) bool {
		return files[i].Name() < files[j].Name()
	})

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".sql" {
			fmt.Printf("Ejecutando migración: %s\n", file.Name())

			content, err := os.ReadFile(filepath.Join("migrations", file.Name()))
			if err != nil {
				return fmt.Errorf("error leyendo %s: %w", file.Name(), err)
			}

			_, err = DB.Exec(context.Background(), string(content))
			if err != nil {
				return fmt.Errorf("error ejecutando %s: %w", file.Name(), err)
			}
		}
	}

	fmt.Println("Todas las migraciones aplicadas correctamente")
	return nil
}
