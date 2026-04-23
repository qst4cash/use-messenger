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

	"use-backend/auth"
	"use-backend/db"
	"use-backend/models"

	"github.com/gorilla/mux"
)

func Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if len(req.Username) < 3 || len(req.Password) < 6 {
		http.Error(w, "Username must be 3+ chars, password 6+ chars", http.StatusBadRequest)
		return
	}

	// Validate username: only latin letters, digits, and underscore
	for _, char := range req.Username {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char == '_') {
			http.Error(w, "Username can only contain latin letters, digits, and underscore", http.StatusBadRequest)
			return
		}
	}

	hash := auth.HashPassword(req.Password)

	user, err := db.Store.CreateUser(req.Username, hash)
	if err != nil {
		http.Error(w, "Username already exists", http.StatusConflict)
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.LoginResponse{
		Token: token,
		User:  user.ToModel(),
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	user, err := db.Store.GetUserByUsername(req.Username)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if !auth.VerifyPassword(req.Password, user.PasswordHash) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.LoginResponse{
		Token: token,
		User:  user.ToModel(),
	})
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	users := db.Store.GetAllUsers()
	result := make([]models.User, len(users))
	for i, u := range users {
		result[i] = u.ToModel()
	}
	json.NewEncoder(w).Encode(result)
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.ParseInt(vars["id"], 10, 64)

	user, err := db.Store.GetUserByID(id)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(user.ToModel())
}

func UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(int64)
	if !ok {
		log.Printf("UploadAvatar: user_id not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	log.Printf("UploadAvatar: userID=%d", userID)

	// Parse multipart form (max 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		log.Printf("UploadAvatar: ParseMultipartForm error: %v", err)
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		log.Printf("UploadAvatar: FormFile error: %v", err)
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	log.Printf("UploadAvatar: received file %s", header.Filename)

	// Check file type
	ext := filepath.Ext(header.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		log.Printf("UploadAvatar: invalid extension %s", ext)
		http.Error(w, "Only jpg, png, gif allowed", http.StatusBadRequest)
		return
	}

	// Create unique filename
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
	filePath := filepath.Join("uploads", "avatars", filename)

	log.Printf("UploadAvatar: saving to %s", filePath)

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("UploadAvatar: Create error: %v", err)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file
	if _, err := io.Copy(dst, file); err != nil {
		log.Printf("UploadAvatar: Copy error: %v", err)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Update database
	avatarURL := fmt.Sprintf("/uploads/avatars/%s", filename)
	if err := db.Store.UpdateUserAvatar(userID, avatarURL); err != nil {
		log.Printf("UploadAvatar: UpdateUserAvatar error: %v", err)
		http.Error(w, "Failed to update avatar", http.StatusInternalServerError)
		return
	}

	log.Printf("UploadAvatar: success, avatarURL=%s", avatarURL)

	// Notify all connected clients about avatar update
	BroadcastAvatarUpdate(userID, avatarURL)

	json.NewEncoder(w).Encode(map[string]string{
		"avatar": avatarURL,
	})
}

func UpdateUserBio(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Bio string `json:"bio"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := db.Store.UpdateUserBio(userID, req.Bio); err != nil {
		http.Error(w, "Failed to update bio", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"bio": req.Bio,
	})
}

func UpdateUserNickname(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Nickname string `json:"nickname"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if len(req.Nickname) < 1 || len(req.Nickname) > 50 {
		http.Error(w, "Nickname must be 1-50 characters", http.StatusBadRequest)
		return
	}

	if err := db.Store.UpdateUserNickname(userID, req.Nickname); err != nil {
		http.Error(w, "Failed to update nickname", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"nickname": req.Nickname,
	})
}
