package main

import (
	"encoding/json"
	"net/http"

	"github.com/syumai/workers-go"
	"github.com/vinta/pangu"
)

func main() {
	http.HandleFunc("/text", func(w http.ResponseWriter, r *http.Request) {
		t := r.URL.Query().Get("t")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"text":    pangu.SpacingText(t),
			"version": pangu.Version,
		})
	})
	workers.Serve(nil) // http.DefaultServeMux
}
