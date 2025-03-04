package main

import (
	"fmt"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "¡Hola, CI/CD con GitHub Actions y Render en Go!")
}

func main() {
	http.HandleFunc("/", handler)
	fmt.Println("Servidor iniciado en el puerto 8080")
	http.ListenAndServe(":8080", nil)
}
