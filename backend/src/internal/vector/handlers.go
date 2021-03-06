package vector

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
)

const (
	ErrorFailedToParse = "Failed to parse body."
	ErrorMissingBody   = "Missing request body."
)

func ApplyPostRequest(store Interface, request *PostRequest) PostResponse {
	var response PostResponse

	if request.CommandStore != nil {
		response.ResultStore = ApplyCommandStore(store, request.CommandStore)
	}

	if request.CommandIndex != nil {
		response.ResultIndex = ApplyCommandIndex(store, request.CommandIndex)
	}

	return response
}

func ApplyCommandStore(store Interface, cmd *CommandStore) *ResultStore {
	if err := store.WriteJSON(cmd.Filename, cmd.Content); err != nil {
		return &ResultStore{Error: err.Error()}
	}

	return &ResultStore{}
}

func ApplyCommandIndex(store Interface, cmd *CommandIndex) *ResultIndex {
	index, err := store.GetIndex()
	if err != nil {
		return &ResultIndex{Error: err.Error()}
	}

	return &ResultIndex{Filenames: index}
}

func WritePostResponse(w http.ResponseWriter, response PostResponse) {
	if body, err := json.Marshal(response); err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	} else {
		http.Error(w, "Failed to marshal PostResponse", http.StatusInternalServerError)
	}
}

func ParsePostRequest(reader io.Reader) (*PostRequest, error) {
	if reader == nil {
		return nil, fmt.Errorf(ErrorMissingBody)
	}

	var request PostRequest
	if err := json.NewDecoder(reader).Decode(&request); err != nil {
		return nil, fmt.Errorf(ErrorFailedToParse)
	}

	return &request, nil
}

func PostHandler(store Interface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		request, err := ParsePostRequest(r.Body)
		if err != nil {
			log.Printf("PostHandler Error: %s", err.Error())
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		response := ApplyPostRequest(store, request)

		WritePostResponse(w, response)
	}
}

func GetHandler(store Interface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		base := filepath.Base(r.URL.Path)
		if base == "placeholder.svg" {
			servePlaceholder(w, r)
		} else {
			path := store.PathFor(base)
			http.ServeFile(w, r, path)
		}
	}
}

func servePlaceholder(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	width, err := strconv.Atoi(q.Get("width"))
	if err != nil {
		msg := fmt.Sprintf("Cannot build placeholder if width = '%s'", q.Get("width"))
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	height, err := strconv.Atoi(q.Get("height"))
	if err != nil {
		msg := fmt.Sprintf("Cannot build placeholder if height = '%s'", q.Get("height"))
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	w.Header().Add("Content-Type", "image/svg+xml")
	const tmpl = `<svg viewBox="0,0,%d,%d" xmlns="http://www.w3.org/2000/svg"></svg>`
	fmt.Fprintf(w, tmpl, width, height)
}
