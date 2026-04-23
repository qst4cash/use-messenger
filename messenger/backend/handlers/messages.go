package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"use-backend/db"
	"use-backend/models"

	"github.com/gorilla/mux"
)

func GetMessages(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	chatID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		log.Printf("GetMessages: invalid chatID: %v", err)
		http.Error(w, "Invalid chat ID", http.StatusBadRequest)
		return
	}

	// Get user from context
	userID, ok := r.Context().Value("user_id").(int64)
	if !ok {
		log.Printf("GetMessages: user_id not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Mark messages as read
	err = db.Store.MarkMessagesAsRead(chatID, userID)
	if err != nil {
		log.Printf("GetMessages: MarkMessagesAsRead error: %v", err)
	}

	msgs := db.Store.GetMessagesByChatID(chatID)
	log.Printf("GetMessages: chatID=%d, found %d messages", chatID, len(msgs))

	result := make([]models.Message, len(msgs))
	for i, m := range msgs {
		user, err := db.Store.GetUserByID(m.UserID)
		if err != nil {
			log.Printf("GetMessages: GetUserByID error for userID=%d: %v", m.UserID, err)
			continue
		}
		username := ""
		if user != nil {
			username = user.Username
		}
		result[i] = m.ToModel(username)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("GetMessages: JSON encode error: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

func DeleteMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	messageID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		log.Printf("DeleteMessage: invalid messageID: %v", err)
		http.Error(w, "Invalid message ID", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("user_id").(int64)
	if !ok {
		log.Printf("DeleteMessage: user_id not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err = db.Store.DeleteMessage(messageID, userID)
	if err != nil {
		log.Printf("DeleteMessage: error: %v", err)
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	log.Printf("DeleteMessage: messageID=%d deleted by userID=%d", messageID, userID)

	// Broadcast deletion to all clients
	BroadcastMessageDelete(messageID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}
