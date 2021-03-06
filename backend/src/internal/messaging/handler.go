package messaging

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func GetHandler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Message handler failed to upgrade GET to websocket: %s", err.Error())
			return
		}

		client := &Client{hub: hub, conn: conn, send: make(chan []byte, 1028), playback: make(chan [][]byte, 1)}
		client.hub.register <- client

		go client.writePump()
		go client.readPump()
	}
}
