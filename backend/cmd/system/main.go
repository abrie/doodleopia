package main

import (
	"backend/internal/message"
	"backend/internal/vector"

	"flag"
	"path"
	"sync"
)

var wg sync.WaitGroup

func main() {
	directory := flag.String("d", ".", "base data directory")
	flag.Parse()

	wg.Add(2)
	go serveVector(path.Join(*directory, "vector"), 9200)
	go serveMessage(9300)

	wg.Wait()
}

func serveVector(directory string, port int) {
	defer wg.Done()

	store := vector.Store{Directory: directory}
	store.Serve(port)
}

func serveMessage(port int) {
	defer wg.Done()

	store := message.Store{}
	store.Serve(port)
}
