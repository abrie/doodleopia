package main

import (
	"backend/internal/message"
	"backend/internal/vector"

	"flag"
	"log"
	"os"
	"os/signal"
	"path"
	"sync"
)

var wg sync.WaitGroup
var done chan struct{}

func main() {
	done = make(chan struct{})

	directory := flag.String("d", ".", "base data directory")
	flag.Parse()

	wg.Add(2)

	go serveVector(path.Join(*directory, "vector"), 9200)
	go serveMessage(path.Join(*directory, "message"), 9300)

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)

	<-stop
	log.Println("Terminating system...")

	close(done)

	wg.Wait()

	log.Println("Terminated.")
}

func serveVector(directory string, port int) {
	defer wg.Done()

	store := vector.Store{Directory: directory}
	store.Serve(port, done)
}

func serveMessage(directory string, port int) {
	defer wg.Done()

	store := message.Store{Directory: directory}
	store.Serve(port, done)
}
