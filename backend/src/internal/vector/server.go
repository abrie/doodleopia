package vector

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
)

func (store *Store) Serve(port int) {
	handler := chi.NewRouter()

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
