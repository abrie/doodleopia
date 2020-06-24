package main

import (
	"backend/internal/messaging"
	"backend/internal/vector"

	"flag"
	"log"
	"os"
	"os/signal"
	"path"
	"sync"
)

func main() {
	directory := flag.String("d", ".", "base data directory")
	flag.Parse()

	var wg sync.WaitGroup
	stop := make(chan struct{})

	processes := []func(){
		func() {
			defer wg.Done()

			store := vector.Store{
				Directory: path.Join(*directory, "vector"),
				Stop:      stop}

			store.Serve(9200)
		},

		func() {
			defer wg.Done()

			store := messaging.Store{
				Directory: path.Join(*directory, "message"),
				Stop:      stop}

			store.Serve(9300)
		},
	}

	wg.Add(len(processes))

	for _, process := range processes {
		go process()
	}

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	<-interrupt

	log.Println("Stopping system...")

	close(stop)

	wg.Wait()

	log.Println("Stopped.")
}
