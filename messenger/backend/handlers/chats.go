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

func GetChats(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id")
	if userID == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	uid := userID.(int64)
	chats := db.Store.GetChatsByUserID(uid)
	result := make([]models.Chat, len(chats))
	for i, c := range chats {
		chatModel := c.ToModel()
		// Add unread count for this chat
		chatModel.UnreadCount = db.Store.GetUnreadCount(c.ID, uid)

		// Add last message info
		lastMsg := db.Store.GetLastMessage(c.ID)
		if lastMsg != nil {
			chatModel.LastMessage = lastMsg.Content
			chatModel.LastMessageTime = lastMsg.CreatedAt
			chatModel.LastMessageUserID = lastMsg.UserID
		}

		result[i] = chatModel
	}

	json.NewEncoder(w).Encode(result)
}

func CreateChat(w http.ResponseWriter, r *http.Request) {
	log.Println("CreateChat called")
	userID := r.Context().Value("user_id")
	log.Printf("CreateChat: userID from context = %v", userID)
	if userID == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	uid := userID.(int64)

	var req models.CreateChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	log.Printf("CreateChat: userID=%d, otherUserID=%d", uid, req.UserID)
	chat, err := db.Store.CreateChat(uid, req.UserID)
	if err != nil {
		http.Error(w, "Failed to create chat", http.StatusInternalServerError)
		return
	}

	result := chat.ToModel()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func GetChat(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.ParseInt(vars["id"], 10, 64)

	chat, err := db.Store.GetChatByID(id)
	if err != nil {
		http.Error(w, "Chat not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(chat.ToModel())
}
