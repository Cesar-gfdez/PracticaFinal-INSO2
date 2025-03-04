package main

import (
	"fmt"
	"log"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "¡Hola, CI/CD con GitHub Actions y Render en Go!")
}

func main() {
	http.HandleFunc("/", handler)
	fmt.Println("Servidor iniciado en el puerto 8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
