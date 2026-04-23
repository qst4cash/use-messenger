package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"use-backend/db"
	"use-backend/handlers"
	"use-backend/middleware"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	if err := db.Init(); err != nil {
		log.Fatal("Failed to init database:", err)
	}
	defer db.Close()

	// Create uploads directories
	if err := os.MkdirAll("uploads/avatars", 0755); err != nil {
		log.Fatal("Failed to create uploads/avatars:", err)
	}
	if err := os.MkdirAll("uploads/files/image", 0755); err != nil {
		log.Fatal("Failed to create uploads/files/image:", err)
	}
	if err := os.MkdirAll("uploads/files/video", 0755); err != nil {
		log.Fatal("Failed to create uploads/files/video:", err)
	}
	if err := os.MkdirAll("uploads/files/audio", 0755); err != nil {
		log.Fatal("Failed to create uploads/files/audio:", err)
	}

	r := mux.NewRouter()

	// CORS middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			origin := req.Header.Get("Origin")
			allowedOrigins := getAllowedOrigins()

			for _, allowed := range allowedOrigins {
				if origin == allowed {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					break
				}
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if req.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, req)
		})
	})

	r.Use(middleware.AuthMiddleware)

	r.HandleFunc("/api/auth/register", handlers.Register).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/auth/login", handlers.Login).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/users/avatar", handlers.UploadAvatar).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/users/{id}/bio", handlers.UpdateUserBio).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/users/{id}/nickname", handlers.UpdateUserNickname).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/users", handlers.GetUsers).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/{id}", handlers.GetUser).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/chats", handlers.GetChats).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/chats", handlers.CreateChat).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/chats/{id}", handlers.GetChat).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/chats/{id}/messages", handlers.GetMessages).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/messages/{id}", handlers.DeleteMessage).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/files/upload", handlers.UploadFile).Methods("POST", "OPTIONS")

	// WebSocket endpoint (must be before PathPrefix)
	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleWebSocket(upgrader, w, r)
	})

	// Serve uploaded files
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Serve static frontend files
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static")))

	// Check if SSL certificates exist
	certFile := os.Getenv("SSL_CERT_FILE")
	keyFile := os.Getenv("SSL_KEY_FILE")

	if certFile != "" && keyFile != "" {
		log.Println("Server starting on :4000 with HTTPS")
		if err := http.ListenAndServeTLS(":4000", certFile, keyFile, r); err != nil {
			log.Fatal(err)
		}
	} else {
		log.Println("Server starting on :4000 with HTTP (no SSL certificates found)")
		if err := http.ListenAndServe(":4000", r); err != nil {
			log.Fatal(err)
		}
	}
}

func getAllowedOrigins() []string {
	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		return []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	}
	return strings.Split(origins, ",")
}
