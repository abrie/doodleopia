package messaging

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/go-chi/chi"

	"backend/internal/collector"
)

func (store *Store) Serve(port int) {
	r := chi.NewRouter()

	storePath, err := store.CreateStore()
	if err != nil {
		log.Fatalf("Failed to create message store: %v", err)
	}

	collectorPath := path.Join(storePath, "collected.bin")
	collectorWriter, err := os.OpenFile(collectorPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		log.Fatal(err)
	}

	collectorReader, err := os.Open(collectorPath)
	if err != nil {
		log.Fatal(err)
	}

	collector := collector.NewCollector(collectorWriter, collectorReader)
	collector.Start()
	hub := newHub(collector)
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

	<-store.Stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("—MESSAGESERVICE— shutdown failed: %v\n", err)
	}

	collector.Stop()
	<-collector.Finished
}
