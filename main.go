package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

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

	// Ruta base
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

	// Ruta GET /auth/discord/login
	router.GET("/auth/discord/login", func(c *gin.Context) {
		clientID := os.Getenv("DISCORD_CLIENT_ID")
		redirectURI := os.Getenv("DISCORD_REDIRECT_URI")

		url := "https://discord.com/oauth2/authorize" +
			"?client_id=" + clientID +
			"&redirect_uri=" + redirectURI +
			"&response_type=code" +
			"&scope=identify"

		c.Redirect(302, url)
	})

    router.GET("/auth/discord/callback", func(c *gin.Context) {
        code := c.Query("code")
        if code == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "No se proporcionó el código de autorización"})
            return
        }
    
        data := url.Values{}
        data.Set("client_id", os.Getenv("DISCORD_CLIENT_ID"))
        data.Set("client_secret", os.Getenv("DISCORD_CLIENT_SECRET"))
        data.Set("grant_type", "authorization_code")
        data.Set("code", code)
        data.Set("redirect_uri", os.Getenv("DISCORD_REDIRECT_URI"))
        data.Set("scope", "identify")
    
        req, err := http.NewRequest("POST", "https://discord.com/api/oauth2/token", bytes.NewBufferString(data.Encode()))
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando la solicitud de token"})
            return
        }
        req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    
        client := http.Client{Timeout: 10 * time.Second}
        res, err := client.Do(req)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Error enviando la solicitud de token"})
            return
        }
        defer res.Body.Close()
    
        body, _ := io.ReadAll(res.Body)
    
        var tokenResp struct {
            AccessToken string `json:"access_token"`
            TokenType   string `json:"token_type"`
        }
        if err := json.Unmarshal(body, &tokenResp); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decodificando la respuesta de token"})
            return
        }
    
        // Obtener perfil del usuario
        req, _ = http.NewRequest("GET", "https://discord.com/api/users/@me", nil)
        req.Header.Set("Authorization", tokenResp.TokenType+" "+tokenResp.AccessToken)
    
        res, err = client.Do(req)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo el perfil del usuario"})
            return
        }
        defer res.Body.Close()
    
        body, _ = io.ReadAll(res.Body)
    
        var userData struct {
            ID       string `json:"id"`
            Username string `json:"username"`
            Avatar   string `json:"avatar"`
        }
        if err := json.Unmarshal(body, &userData); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decodificando perfil del usuario"})
            return
        }
    
        // TODO: Aquí puedes insertar o actualizar el usuario en la BBDD
        c.JSON(http.StatusOK, gin.H{
            "message":  "Login exitoso con Discord",
            "id":       userData.ID,
            "username": userData.Username,
            "avatar":   "https://cdn.discordapp.com/avatars/" + userData.ID + "/" + userData.Avatar + ".png",
        })
    })
    

	// Arrancar servidor
	log.Println("🚀 Servidor iniciado en el puerto 8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("❌ Error al iniciar el servidor: %v", err)
	}
}
