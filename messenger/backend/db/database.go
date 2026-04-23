package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"use-backend/models"

	_ "modernc.org/sqlite"
)

type User struct {
	ID           int64
	Username     string
	Nickname     string
	PasswordHash string
	AvatarURL    string
	Bio          string
	CreatedAt    time.Time
}

type Chat struct {
	ID        int64
	Users     []int64
	CreatedAt time.Time
}

type Message struct {
	ID        int64
	ChatID    int64
	UserID    int64
	Content   string
	FileURL   string
	FileType  string
	FileName  string
	Read      bool
	CreatedAt time.Time
}

type DB struct {
	conn *sql.DB
}

var Store *DB

func Init() error {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "./use.db"
	}

	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	Store = &DB{conn: conn}

	// Create tables
	_, err = conn.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			avatar_url TEXT DEFAULT '',
			nickname TEXT DEFAULT '',
			bio TEXT DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS chats (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user1_id INTEGER NOT NULL,
			user2_id INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user1_id, user2_id)
		);

		CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			chat_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			content TEXT NOT NULL,
			file_url TEXT DEFAULT '',
			file_type TEXT DEFAULT '',
			file_name TEXT DEFAULT '',
			read INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(chat_id) REFERENCES chats(id),
			FOREIGN KEY(user_id) REFERENCES users(id)
		);
	`)

	if err != nil {
		return err
	}

	// Add avatar_url column if it doesn't exist (migration)
	_, err = conn.Exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''`)
	if err != nil {
		// Column might already exist, ignore error
		log.Println("Migration note: avatar_url column might already exist")
	}

	// Add bio column if it doesn't exist (migration)
	_, err = conn.Exec(`ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''`)
	if err != nil {
		log.Println("Migration note: bio column might already exist")
	}

	// Add nickname column if it doesn't exist (migration)
	_, err = conn.Exec(`ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ''`)
	if err != nil {
		log.Println("Migration note: nickname column might already exist")
	}

	// Add file_url and file_type columns to messages (migration)
	_, err = conn.Exec(`ALTER TABLE messages ADD COLUMN file_url TEXT DEFAULT ''`)
	if err != nil {
		log.Println("Migration note: file_url column might already exist")
	}
	_, err = conn.Exec(`ALTER TABLE messages ADD COLUMN file_type TEXT DEFAULT ''`)
	if err != nil {
		log.Println("Migration note: file_type column might already exist")
	}
	_, err = conn.Exec(`ALTER TABLE messages ADD COLUMN file_name TEXT DEFAULT ''`)
	if err != nil {
		log.Println("Migration note: file_name column might already exist")
	}

	log.Println("SQLite database initialized")
	return nil
}

func Close() {
	if Store != nil && Store.conn != nil {
		Store.conn.Close()
	}
}

func (db *DB) CreateUser(username, passwordHash string) (*User, error) {
	result, err := db.conn.Exec(
		"INSERT INTO users (username, password_hash, nickname, avatar_url, bio) VALUES (?, ?, ?, ?, ?)",
		username, passwordHash, username, "", "",
	)
	if err != nil {
		return nil, ErrUserExists
	}

	id, _ := result.LastInsertId()
	return &User{
		ID:           id,
		Username:     username,
		Nickname:     username,
		PasswordHash: passwordHash,
		AvatarURL:    "",
		Bio:          "",
		CreatedAt:    time.Now(),
	}, nil
}

func (db *DB) GetUserByID(id int64) (*User, error) {
	var user User
	err := db.conn.QueryRow(
		"SELECT id, username, COALESCE(nickname, username), password_hash, avatar_url, COALESCE(bio, ''), created_at FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Username, &user.Nickname, &user.PasswordHash, &user.AvatarURL, &user.Bio, &user.CreatedAt)

	if err != nil {
		return nil, ErrUserNotFound
	}
	return &user, nil
}

func (db *DB) GetUserByUsername(username string) (*User, error) {
	var user User
	err := db.conn.QueryRow(
		"SELECT id, username, COALESCE(nickname, username), password_hash, avatar_url, COALESCE(bio, ''), created_at FROM users WHERE username = ?",
		username,
	).Scan(&user.ID, &user.Username, &user.Nickname, &user.PasswordHash, &user.AvatarURL, &user.Bio, &user.CreatedAt)

	if err != nil {
		return nil, ErrUserNotFound
	}
	return &user, nil
}

func (db *DB) GetAllUsers() []*User {
	rows, err := db.conn.Query("SELECT id, username, COALESCE(nickname, username), password_hash, avatar_url, COALESCE(bio, ''), created_at FROM users")
	if err != nil {
		return []*User{}
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		var user User
		rows.Scan(&user.ID, &user.Username, &user.Nickname, &user.PasswordHash, &user.AvatarURL, &user.Bio, &user.CreatedAt)
		users = append(users, &user)
	}
	return users
}

func (db *DB) CreateChat(user1ID, user2ID int64) (*Chat, error) {
	// Normalize order
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}

	// Check if exists
	var existingID int64
	err := db.conn.QueryRow(
		"SELECT id FROM chats WHERE user1_id = ? AND user2_id = ?",
		user1ID, user2ID,
	).Scan(&existingID)

	if err == nil {
		return db.GetChatByID(existingID)
	}

	result, err := db.conn.Exec(
		"INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)",
		user1ID, user2ID,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return &Chat{
		ID:        id,
		Users:     []int64{user1ID, user2ID},
		CreatedAt: time.Now(),
	}, nil
}

func (db *DB) GetChatByID(id int64) (*Chat, error) {
	var chat Chat
	var user1, user2 int64
	err := db.conn.QueryRow(
		"SELECT id, user1_id, user2_id, created_at FROM chats WHERE id = ?",
		id,
	).Scan(&chat.ID, &user1, &user2, &chat.CreatedAt)

	if err != nil {
		return nil, ErrChatNotFound
	}

	chat.Users = []int64{user1, user2}
	return &chat, nil
}

func (db *DB) GetChatsByUserID(userID int64) []*Chat {
	rows, err := db.conn.Query(
		"SELECT id, user1_id, user2_id, created_at FROM chats WHERE user1_id = ? OR user2_id = ?",
		userID, userID,
	)
	if err != nil {
		return []*Chat{}
	}
	defer rows.Close()

	var chats []*Chat
	for rows.Next() {
		var chat Chat
		var user1, user2 int64
		rows.Scan(&chat.ID, &user1, &user2, &chat.CreatedAt)
		chat.Users = []int64{user1, user2}
		chats = append(chats, &chat)
	}
	return chats
}

func (db *DB) CreateMessage(chatID, userID int64, content string) (*Message, error) {
	result, err := db.conn.Exec(
		"INSERT INTO messages (chat_id, user_id, content, file_url, file_type, read) VALUES (?, ?, ?, '', '', 0)",
		chatID, userID, content,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return &Message{
		ID:        id,
		ChatID:    chatID,
		UserID:    userID,
		Content:   content,
		FileURL:   "",
		FileType:  "",
		Read:      false,
		CreatedAt: time.Now(),
	}, nil
}

func (db *DB) CreateMessageWithFile(chatID, userID int64, content, fileURL, fileType, fileName string) (*Message, error) {
	result, err := db.conn.Exec(
		"INSERT INTO messages (chat_id, user_id, content, file_url, file_type, file_name, read) VALUES (?, ?, ?, ?, ?, ?, 0)",
		chatID, userID, content, fileURL, fileType, fileName,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return &Message{
		ID:        id,
		ChatID:    chatID,
		UserID:    userID,
		Content:   content,
		FileURL:   fileURL,
		FileType:  fileType,
		FileName:  fileName,
		Read:      false,
		CreatedAt: time.Now(),
	}, nil
}

func (db *DB) GetMessagesByChatID(chatID int64) []*Message {
	rows, err := db.conn.Query(
		"SELECT id, chat_id, user_id, content, file_url, file_type, file_name, read, created_at FROM messages WHERE chat_id = ? ORDER BY id ASC",
		chatID,
	)
	if err != nil {
		log.Printf("GetMessagesByChatID query error: %v", err)
		return []*Message{}
	}
	defer rows.Close()

	var msgs []*Message
	for rows.Next() {
		var msg Message
		var readInt int
		var createdAt string
		err := rows.Scan(&msg.ID, &msg.ChatID, &msg.UserID, &msg.Content, &msg.FileURL, &msg.FileType, &msg.FileName, &readInt, &createdAt)
		if err != nil {
			log.Printf("GetMessagesByChatID scan error: %v", err)
			continue
		}
		msg.Read = readInt == 1
		msg.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		msgs = append(msgs, &msg)
	}
	return msgs
}

func (db *DB) UpdateUserAvatar(userID int64, avatarURL string) error {
	_, err := db.conn.Exec(
		"UPDATE users SET avatar_url = ? WHERE id = ?",
		avatarURL, userID,
	)
	return err
}

func (db *DB) UpdateUserBio(userID int64, bio string) error {
	_, err := db.conn.Exec(
		"UPDATE users SET bio = ? WHERE id = ?",
		bio, userID,
	)
	return err
}

func (db *DB) UpdateUserNickname(userID int64, nickname string) error {
	_, err := db.conn.Exec(
		"UPDATE users SET nickname = ? WHERE id = ?",
		nickname, userID,
	)
	return err
}

func (db *DB) MarkMessagesAsRead(chatID, userID int64) error {
	_, err := db.conn.Exec(
		"UPDATE messages SET read = 1 WHERE chat_id = ? AND user_id != ?",
		chatID, userID,
	)
	return err
}

func (db *DB) DeleteMessage(messageID, userID int64) error {
	result, err := db.conn.Exec(
		"DELETE FROM messages WHERE id = ? AND user_id = ?",
		messageID, userID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("message not found or unauthorized")
	}

	return nil
}

type DBError struct {
	Message string
}

func (e DBError) Error() string { return e.Message }

var (
	ErrUserExists   = DBError{Message: "user already exists"}
	ErrUserNotFound = DBError{Message: "user not found"}
	ErrChatNotFound = DBError{Message: "chat not found"}
)

// Helper to convert to models
func (u *User) ToModel() models.User {
	return models.User{
		ID:        u.ID,
		Username:  u.Username,
		Nickname:  u.Nickname,
		AvatarURL: u.AvatarURL,
		Bio:       u.Bio,
		CreatedAt: u.CreatedAt,
	}
}

func (c *Chat) ToModel() models.Chat {
	chatUsers := make([]models.User, 0, len(c.Users))
	for _, uid := range c.Users {
		if u, err := Store.GetUserByID(uid); err == nil {
			chatUsers = append(chatUsers, u.ToModel())
		}
	}
	return models.Chat{
		ID:        c.ID,
		CreatedAt: c.CreatedAt,
		Users:     chatUsers,
	}
}

func (m *Message) ToModel(username string) models.Message {
	return models.Message{
		ID:        m.ID,
		ChatID:    m.ChatID,
		UserID:    m.UserID,
		Username:  username,
		Content:   m.Content,
		FileURL:   m.FileURL,
		FileType:  m.FileType,
		FileName:  m.FileName,
		Read:      m.Read,
		CreatedAt: m.CreatedAt,
	}
}
