package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"use-backend/db"
)

func UploadFile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse multipart form (max 50MB)
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		log.Printf("UploadFile: ParseMultipartForm error: %v", err)
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	chatIDStr := r.FormValue("chat_id")
	chatID, err := strconv.ParseInt(chatIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid chat_id", http.StatusBadRequest)
		return
	}

	fileType := r.FormValue("file_type") // "image", "video", "audio"

	file, header, err := r.FormFile("file")
	if err != nil {
		log.Printf("UploadFile: FormFile error: %v", err)
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	log.Printf("UploadFile: userID=%d, chatID=%d, fileType=%s, filename=%s", userID, chatID, fileType, header.Filename)

	// Save original filename
	originalFilename := header.Filename

	// Check file type
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
		".mp4": true, ".webm": true, ".mov": true,
		".mp3": true, ".wav": true, ".ogg": true, ".m4a": true,
	}
	if !allowedExts[ext] {
		http.Error(w, "File type not allowed", http.StatusBadRequest)
		return
	}

	// Create directory structure
	uploadDir := filepath.Join("uploads", "files", fileType)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("UploadFile: MkdirAll error: %v", err)
		http.Error(w, "Failed to create directory", http.StatusInternalServerError)
		return
	}

	// Create unique filename
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, filename)

	log.Printf("UploadFile: saving to %s", filePath)

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("UploadFile: Create error: %v", err)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		log.Printf("UploadFile: Copy error: %v", err)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Save message to database
	fileURL := fmt.Sprintf("/uploads/files/%s/%s", fileType, filename)
	// Use fileURL as content for file messages
	msg, err := db.Store.CreateMessageWithFile(chatID, userID, fileURL, fileURL, fileType, originalFilename)
	if err != nil {
		log.Printf("UploadFile: CreateMessageWithFile error: %v", err)
		http.Error(w, "Failed to save message", http.StatusInternalServerError)
		return
	}

	log.Printf("UploadFile: success, fileURL=%s", fileURL)

	// Get username for broadcast
	user, err := db.Store.GetUserByID(userID)
	username := ""
	if err == nil && user != nil {
		username = user.Username
	}

	// Broadcast to WebSocket clients
	BroadcastMessage(msg, username)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":        msg.ID,
		"chat_id":   msg.ChatID,
		"user_id":   msg.UserID,
		"content":   msg.Content,
		"file_url":  msg.FileURL,
		"file_type": msg.FileType,
		"file_name": msg.FileName,
	})
}
