package auth

import (
	"golang.org/x/crypto/argon2"
	"encoding/base64"
)

func HashPassword(password string) string {
	hash := argon2.IDKey([]byte(password), []byte("use-salt-change-in-production"), 1, 64*1024, 4, 32)
	return base64.RawStdEncoding.EncodeToString(hash)
}

func VerifyPassword(password, hash string) bool {
	expected := argon2.IDKey([]byte(password), []byte("use-salt-change-in-production"), 1, 64*1024, 4, 32)
	actual, err := base64.RawStdEncoding.DecodeString(hash)
	if err != nil {
		return false
	}
	return string(expected) == string(actual)
}
