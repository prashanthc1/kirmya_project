package cache

import (
	"encoding/json"
	"fmt"
)

// Marshal helper for cache storage
func Marshal(v interface{}) (string, error) {
	bytes, err := json.Marshal(v)
	if err != nil {
		return "", fmt.Errorf("failed to marshal cache object: %w", err)
	}
	return string(bytes), nil
}

// Unmarshal helper for cache retrieval
func Unmarshal(data string, v interface{}) error {
	if data == "" {
		return fmt.Errorf("empty cache payload")
	}
	return json.Unmarshal([]byte(data), v)
}
