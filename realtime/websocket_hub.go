package realtime

import (
	"net/http"
	"sync"

	"github.com/gorilla/websocket"

	"github.com/gin-gonic/gin"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // permitir cualquier origen (para pruebas; en prod mejor restringir)
	},
}

type WebSocketHub struct {
	clients map[*websocket.Conn]bool
	mu      sync.Mutex
}

var wsHub = WebSocketHub{
	clients: make(map[*websocket.Conn]bool),
}

// Handler para /ws
func WebSocketHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	// Añadir cliente al hub
	wsHub.mu.Lock()
	wsHub.clients[conn] = true
	wsHub.mu.Unlock()

	defer func() {
		wsHub.mu.Lock()
		delete(wsHub.clients, conn)
		wsHub.mu.Unlock()
		conn.Close()
	}()

	// Leer mensajes (aunque no esperamos recibir, mantenemos la conexión viva)
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// Función para enviar broadcast a todos los clientes
func Broadcast(message string) {
	wsHub.mu.Lock()
	defer wsHub.mu.Unlock()

	for client := range wsHub.clients {
		err := client.WriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			client.Close()
			delete(wsHub.clients, client)
		}
	}
}
