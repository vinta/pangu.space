package handler

import (
	"encoding/json"
	"net/http"

	"github.com/vinta/pangu"
)

// Vercel picks up any exported http.HandlerFunc in an api/*.go file
func Handler(w http.ResponseWriter, r *http.Request) {
	t := r.URL.Query().Get("t")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"text":    pangu.SpacingText(t),
		"lib":     "pangu-go",
		"version": pangu.Version,
	})
}
