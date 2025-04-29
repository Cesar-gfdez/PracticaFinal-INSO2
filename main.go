package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"torneos/database"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "¡Hola, CI/CD con GitHub Actions y Render en Go!")
}

func main() {
	// Cargar .env
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error cargando el archivo .env: %v", err)
	}

	// Conectar a la base de datos
	err = database.ConnectDatabase()
	if err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	defer database.CloseDatabase()

	// Registrar handler y arrancar servidor
	http.HandleFunc("/", handler)
	log.Println("Conectado correctamente a PostgreSQL")
	log.Println("Servidor iniciado en el puerto 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}

	
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	log.Println("Cerrando servidor")
}
