package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"
	"fmt"

	"torneos/auth"
	"torneos/database"
	"torneos/models"
	"torneos/utils"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/gin-contrib/cors"

)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No se pudo cargar .env (probablemente en producción)")
	}

	err = database.ConnectDatabase()
	if err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	defer database.CloseDatabase()

	if err := database.RunMigrations(); err != nil {
		log.Fatalf("Error aplicando migración: %v", err)
	}
	// Redireccionar al frontend con el token
	frontendURL := os.Getenv("FRONTEND_URL")
if frontendURL == "" {
    frontendURL = "http://localhost:3000"
}
log.Println("CORS: Allowing origin ->", frontendURL)
router := gin.Default()
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{frontendURL, "http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
    AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))


	router.GET("/", func(c *gin.Context) {
		c.String(200, "¡Servidor con Gin funcionando!")
	})

	router.GET("/api/users", func(c *gin.Context) {
		users, err := database.GetAllUsers()
		if err != nil {
			c.JSON(500, gin.H{"error": "Error al obtener los usuarios"})
			return
		}
		c.JSON(200, users)
	})

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

		avatarURL := "https://cdn.discordapp.com/avatars/" + userData.ID + "/" + userData.Avatar + ".png"

		user, err := database.FindUserByOAuth("discord", userData.ID)
		if err != nil {
			user = &models.User{
				Username:      userData.Username,
				Email:         "",
				OAuthProvider: "discord",
				OAuthID:       userData.ID,
				AvatarURL:     avatarURL,
			}
			user, err = database.CreateUser(user)
			if err != nil {
				c.JSON(500, gin.H{"error": "Error al crear el usuario"})
				return
			}
		}

		// Generar JWT
token, err := auth.GenerateJWT(user.ID)
if err != nil {
	c.JSON(500, gin.H{"error": "No se pudo generar el token"})
	return
}


redirectURL := fmt.Sprintf("%s/auth/callback?token=%s", frontendURL, token)
c.Redirect(http.StatusTemporaryRedirect, redirectURL)

	})

	router.GET("/api/profile", auth.AuthMiddleware(), func(c *gin.Context) {
		userID := c.GetInt("user_id")

		user, err := database.GetUserByID(userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "No se pudo obtener el perfil"})
			return
		}

		c.JSON(200, gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"avatar":    user.AvatarURL,
			"createdAt": user.CreatedAt,
		})
	})

	router.POST("/api/tournaments", auth.AuthMiddleware(), func(c *gin.Context) {
		var input models.CreateTournamentRequest
	
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "JSON inválido"})
			return
		}
	
		if input.Name == "" || input.Game == "" || input.Type == "" {
			c.JSON(400, gin.H{"error": "Faltan campos obligatorios"})
			return
		}
	
		startTime, err := time.Parse(time.RFC3339, input.StartTime)
		if err != nil {
			c.JSON(400, gin.H{"error": "Formato de fecha inválido"})
			return
		}
	
		userID := c.GetInt("user_id")
	
		tournament := &models.Tournament{
			Name:             input.Name,
			Game:             input.Game,
			Type:             input.Type,
			Description:      input.Description,
			Rules:            input.Rules,
			Platform:         input.Platform,
			StartTime:        startTime,
			MaxParticipants:  input.MaxParticipants,
			BannerURL:        input.BannerURL,
			Format:           input.Format,
			CreatedByUserID:  userID,
			CreatedAt:        time.Now(),
		}
	
		tournament, err = database.CreateTournament(tournament)
		if err != nil {
			c.JSON(500, gin.H{"error": "No se pudo crear el torneo"})
			return
		}
	
		c.JSON(201, tournament)
	})
	

	router.GET("/api/tournaments", func(c *gin.Context) {
		tournaments, err := database.GetTournamentsSummary()
		if err != nil {
			fmt.Println("Error al obtener torneos:", err) //
			c.JSON(500, gin.H{"error": "Error al obtener torneos"})
			return
		}
	
		c.JSON(200, tournaments)
	})
	

	router.POST("/api/tournaments/:id/join", auth.AuthMiddleware(), func(c *gin.Context) {
		userID := c.GetInt("user_id")
		tournamentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(400, gin.H{"error": "ID de torneo inválido"})
			return
		}

		participant, err := database.JoinTournament(userID, tournamentID)
		if err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		c.JSON(201, participant)
	})

	router.GET("/api/tournaments/:id", func(c *gin.Context) {
		tournamentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(400, gin.H{"error": "ID inválido"})
			return
		}

		tournament, err := database.GetTournamentByID(tournamentID)
		if err != nil {
			c.JSON(404, gin.H{"error": "Torneo no encontrado"})
			return
		}

		participants, err := database.GetParticipantsByTournamentID(tournamentID)
		if err != nil {
			fmt.Println("Error al obtener participantes:", err) 
			c.JSON(500, gin.H{"error": "Error al obtener participantes"})
			return
		}

		c.JSON(200, gin.H{
			"tournament":   tournament,
			"participants": participants,
		})
	})

	router.GET("/api/tournaments/:id/bracket", func(c *gin.Context) {
		tournamentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(400, gin.H{"error": "ID inválido"})
			return
		}

		participants, err := database.GetParticipantsByTournamentID(tournamentID)
		if err != nil {
			c.JSON(500, gin.H{"error": "No se pudieron obtener los participantes"})
			return
		}

		var playerNames []string
		for _, u := range participants {
			playerNames = append(playerNames, u.Username)
		}

		if len(playerNames) < 2 {
			c.JSON(200, gin.H{
				"tournament_id": tournamentID,
				"bracket":       []string{"Se necesitan al menos 2 participantes para generar brackets"},
			})
			return
		}

		bracket := utils.GenerateBracket(playerNames)

		c.JSON(200, gin.H{
			"tournament_id": tournamentID,
			"bracket":       bracket,
		})
	})

	router.POST("/api/tournaments/:id/bracket/generate", auth.AuthMiddleware(), func(c *gin.Context) {
		tournamentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(400, gin.H{"error": "ID inválido"})
			return
		}

		userID := c.GetInt("user_id")

		tournament, err := database.GetTournamentByID(tournamentID)
		if err != nil {
			c.JSON(404, gin.H{"error": "Torneo no encontrado"})
			return
		}

		if tournament.CreatedByUserID != userID {
			c.JSON(403, gin.H{"error": "Solo el creador del torneo puede generar el bracket"})
			return
		}

		participants, err := database.GetParticipantsByTournamentID(tournamentID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error al obtener participantes"})
			return
		}

		if len(participants) < 2 {
			c.JSON(400, gin.H{"error": "Se necesitan al menos 2 participantes"})
			return
		}

		// Mapear username → ID
		userMap := make(map[string]int)
		var usernames []string
		for _, u := range participants {
			userMap[u.Username] = u.ID
			usernames = append(usernames, u.Username)
		}

		bracket := utils.GenerateBracket(usernames)

		for _, bm := range bracket {
			m := &models.Match{
				TournamentID: tournamentID,
				Round:        bm.Round,
				Status:       "pending",
			}

			if id1, ok := userMap[bm.Player1]; ok {
				m.Player1ID = &id1
			}
			if id2, ok := userMap[bm.Player2]; ok {
				m.Player2ID = &id2
			}

			_, err := database.InsertMatch(m)
			if err != nil {
				c.JSON(500, gin.H{"error": "Error guardando match"})
				return
			}
		}

		c.JSON(201, gin.H{"message": "Bracket generado y guardado correctamente"})
	})

    router.GET("/api/tournaments/:id/matches", func(c *gin.Context) {
		tournamentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(400, gin.H{"error": "ID inválido"})
			return
		}
	
		matches, err := database.GetMatchesWithPlayers(tournamentID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error al obtener matches"})
			return
		}
	
		c.JSON(200, matches)
	})

    router.POST("/api/matches/:id/report", auth.AuthMiddleware(), func(c *gin.Context) {
        userID := c.GetInt("user_id")
        matchID, err := strconv.Atoi(c.Param("id"))
        if err != nil {
            c.JSON(400, gin.H{"error": "ID inválido"})
            return
        }
    
        var input struct {
            WinnerID int `json:"winner_id"`
        }
    
        if err := c.ShouldBindJSON(&input); err != nil || input.WinnerID == 0 {
            c.JSON(400, gin.H{"error": "Debe especificar el ID del ganador"})
            return
        }
    
        err = database.ReportMatchResult(matchID, userID, input.WinnerID)
        if err != nil {
            c.JSON(403, gin.H{"error": err.Error()})
            return
        }
    
        c.JSON(200, gin.H{"message": "Resultado reportado correctamente"})
    })

    router.GET("/api/tournaments/:id/bracket/full", func(c *gin.Context) {
        tournamentID, err := strconv.Atoi(c.Param("id"))
        if err != nil {
            c.JSON(400, gin.H{"error": "ID inválido"})
            return
        }
    
        bracket, err := database.GetMatchesWithPlayers(tournamentID)
        if err != nil {
            c.JSON(500, gin.H{"error": "Error al obtener el bracket"})
            return
        }
    
        c.JSON(200, bracket)
    })

	router.GET("/api/users/:id", func(c *gin.Context) {
		idParam := c.Param("id")
		id, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
	
		user, err := database.GetUserByID(id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
			return
		}
	
		c.JSON(http.StatusOK, user)
	})
	
	router.GET("/api/auth/me", auth.AuthMiddleware(), func(c *gin.Context) {
		c.Request.URL.Path = "/api/profile"
		router.HandleContext(c)
	})
	

	log.Println("Servidor iniciado en el puerto 8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
