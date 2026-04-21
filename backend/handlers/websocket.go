package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"use-backend/auth"
	"use-backend/db"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}
		return false
	},
}

type Client struct {
	UserID   int64
	Username string
	Conn     *websocket.Conn
	Send     chan []byte
}

type Hub struct {
	clients    map[int64]*Client
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

var hub = &Hub{
	clients:    make(map[int64]*Client),
	register:   make(chan *Client),
	unregister: make(chan *Client),
}

func init() {
	go hub.run()
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("Client connected: %s (ID: %d)", client.Username, client.UserID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("Client disconnected: %s (ID: %d)", client.Username, client.UserID)
		}
	}
}

type WSMessage struct {
	Type      string                 `json:"type"`
	ChatID    int64                  `json:"chat_id,omitempty"`
	Content   string                 `json:"content,omitempty"`
	UserID    int64                  `json:"user_id,omitempty"`
	ToUserID  int64                  `json:"to_user_id,omitempty"`
	FromUserID int64                 `json:"from_user_id,omitempty"`
	Offer     map[string]interface{} `json:"offer,omitempty"`
	Answer    map[string]interface{} `json:"answer,omitempty"`
	Candidate map[string]interface{} `json:"candidate,omitempty"`
}

func HandleWebSocket(upgrader websocket.Upgrader, w http.ResponseWriter, r *http.Request) {
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "Token required", http.StatusUnauthorized)
		return
	}

	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	client := &Client{
		UserID:   claims.UserID,
		Username: claims.Username,
		Conn:     conn,
		Send:     make(chan []byte, 256),
	}

	hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		if msg.Type == "message" {
			savedMsg, err := db.Store.CreateMessage(msg.ChatID, c.UserID, msg.Content)
			if err != nil {
				log.Println("Failed to save message:", err)
				continue
			}

			BroadcastMessage(savedMsg)
		} else if msg.Type == "call_offer" || msg.Type == "call_answer" || msg.Type == "ice_candidate" || msg.Type == "call_end" {
			// WebRTC signaling - forward to specific user
			if msg.ToUserID > 0 {
				hub.mu.RLock()
				targetClient, ok := hub.clients[msg.ToUserID]
				hub.mu.RUnlock()

				if ok {
					outMsg := map[string]interface{}{
						"type":         msg.Type,
						"from_user_id": c.UserID,
						"offer":        msg.Offer,
						"answer":       msg.Answer,
						"candidate":    msg.Candidate,
					}
					data, _ := json.Marshal(outMsg)
					select {
					case targetClient.Send <- data:
						log.Printf("Sent %s to user %d", msg.Type, msg.ToUserID)
					default:
						log.Printf("Failed to send %s to user %d", msg.Type, msg.ToUserID)
					}
				}
			}
		}
	}
}

func (c *Client) writePump() {
	defer c.Conn.Close()

	for message := range c.Send {
		if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}

func BroadcastAvatarUpdate(userID int64, avatarURL string) {
	log.Printf("BroadcastAvatarUpdate: userID=%d, avatarURL=%s, clients=%d", userID, avatarURL, len(hub.clients))
	msg := map[string]interface{}{
		"type":       "avatar_update",
		"user_id":    userID,
		"avatar_url": avatarURL,
	}
	data, _ := json.Marshal(msg)
	log.Printf("Broadcasting avatar update: %s", string(data))

	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for clientID, client := range hub.clients {
		select {
		case client.Send <- data:
			log.Printf("Sent avatar update to client %d", clientID)
		default:
			log.Printf("Failed to send avatar update to client %d (channel full)", clientID)
		}
	}
}

func BroadcastMessage(message *db.Message) {
	log.Printf("BroadcastMessage: msgID=%d, chatID=%d, userID=%d", message.ID, message.ChatID, message.UserID)
	msg := map[string]interface{}{
		"type":      "message",
		"id":        message.ID,
		"chat_id":   message.ChatID,
		"user_id":   message.UserID,
		"content":   message.Content,
		"file_url":  message.FileURL,
		"file_type": message.FileType,
		"file_name": message.FileName,
		"read":      message.Read,
	}
	data, _ := json.Marshal(msg)

	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for clientID, client := range hub.clients {
		select {
		case client.Send <- data:
			log.Printf("Sent message to client %d", clientID)
		default:
			log.Printf("Failed to send message to client %d (channel full)", clientID)
		}
	}
}

func BroadcastMessageDelete(messageID int64) {
	log.Printf("BroadcastMessageDelete: msgID=%d", messageID)
	msg := map[string]interface{}{
		"type":       "message_delete",
		"message_id": messageID,
	}
	data, _ := json.Marshal(msg)

	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for clientID, client := range hub.clients {
		select {
		case client.Send <- data:
			log.Printf("Sent message delete to client %d", clientID)
		default:
			log.Printf("Failed to send message delete to client %d (channel full)", clientID)
		}
	}
}
