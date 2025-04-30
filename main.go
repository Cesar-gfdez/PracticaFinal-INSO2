package main

import (
    "log"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "torneos/database"
)

func main() {
    // Cargar archivo .env (si estás en local)
    err := godotenv.Load()
    if err != nil {
        log.Println("⚠️ No se pudo cargar .env (probablemente en producción)")
    }

    // Conexión a PostgreSQL
    err = database.ConnectDatabase()
    if err != nil {
        log.Fatalf("❌ Error conectando a la base de datos: %v", err)
    }
    defer database.CloseDatabase()

    // Ejecutar migraciones
    if err := database.RunMigrations(); err != nil {
        log.Fatalf("❌ Error aplicando migración: %v", err)
    }

    // Crear router Gin
    router := gin.Default()

    // Ruta de prueba
    router.GET("/", func(c *gin.Context) {
        c.String(200, "¡Servidor con Gin funcionando!")
    })

    // Ruta GET /api/users
    router.GET("/api/users", func(c *gin.Context) {
        users, err := database.GetAllUsers()
        if err != nil {
            c.JSON(500, gin.H{"error": "Error al obtener los usuarios"})
            return
        }
        c.JSON(200, users)
    })

    // Arrancar servidor
    log.Println("🚀 Servidor iniciado en el puerto 8080")
    router.Run(":8080")
}