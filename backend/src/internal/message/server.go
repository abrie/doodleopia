package message

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
)

func (store *Store) Serve(port int, done chan struct{}) {
	r := chi.NewRouter()

	statsOutput, err := os.OpenFile("sizes.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		log.Fatal(err)
	}

	statsCollector := NewStatsCollector(statsOutput)
	statsCollector.Start()
	hub := newHub(statsCollector)
	go hub.run()

	r.Get("/", GetHandler(hub))

	addr := fmt.Sprintf(":%d", port)
	server := &http.Server{Addr: addr, Handler: r}

	go func() {
		log.Printf("—MESSAGESERVICE— serving HTTP on %s\n", addr)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			log.Printf("—MESSAGESERVICE— unexpected error: %v", err)
		}
	}()

	<-done

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("—MESSAGESERVICE— shutdown failed: %v\n", err)
	}

	statsCollector.Stop()
	<-statsCollector.Finished

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
