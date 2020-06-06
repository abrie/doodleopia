package vector

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
)

func (store *Store) Serve(port int) {
	r := chi.NewRouter()

	r.Use(newCorsHandler())
	r.Use(middleware.NoCache)

	r.Get("/*", GetHandler(store))
	r.Post("/", PostHandler(store))

	addr := fmt.Sprintf(":%d", port)
	log.Printf("—VECTORSERVICE— now running. Serving HTTP on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}

func newCorsHandler() func(http.Handler) http.Handler {
	options := cors.Options{
		// AllowedOrigins: []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"*"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}

	cors := cors.New(options)
	return cors.Handler
}