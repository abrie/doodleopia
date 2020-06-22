package vector

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
)

func (store *Store) Serve(port int) {
	handler := chi.NewRouter()

	handler.Use(newCorsHandler())
	handler.Use(middleware.NoCache)

	handler.Get("/*", GetHandler(store))
	handler.Post("/", PostHandler(store))

	addr := fmt.Sprintf(":%d", port)
	server := &http.Server{Addr: addr, Handler: handler}
	go func() {
		log.Printf("—VECTORSERVICE— serving HTTP on %s\n", addr)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			log.Printf("—VECTORSERVICE— unexpected error: %v", err)
		}
	}()

	<-store.Stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("—VECTORSERVICE— shutdown error: %v", err)
	}
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
