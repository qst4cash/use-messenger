package models

import "time"

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	Nickname     string    `json:"nickname"`
	PasswordHash string    `json:"-"`
	AvatarURL    string    `json:"avatar"`
	Bio          string    `json:"bio"`
	CreatedAt    time.Time `json:"created_at"`
}

type Chat struct {
	ID                 int64     `json:"id"`
	CreatedAt          time.Time `json:"created_at"`
	Users              []User    `json:"users,omitempty"`
	UnreadCount        int       `json:"unread_count,omitempty"`
	LastMessage        string    `json:"last_message,omitempty"`
	LastMessageTime    time.Time `json:"last_message_time,omitempty"`
	LastMessageUserID  int64     `json:"last_message_user_id,omitempty"`
	LastMessageType    string    `json:"last_message_type,omitempty"`
}

type Message struct {
	ID        int64     `json:"id"`
	ChatID    int64     `json:"chat_id"`
	UserID    int64     `json:"user_id"`
	Username  string    `json:"username,omitempty"`
	Content   string    `json:"content"`
	FileURL   string    `json:"file_url,omitempty"`
	FileType  string    `json:"file_type,omitempty"`
	FileName  string    `json:"file_name,omitempty"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"created_at"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateChatRequest struct {
	UserID int64 `json:"user_id"`
}

type SendMessageRequest struct {
	Content string `json:"content"`
}
