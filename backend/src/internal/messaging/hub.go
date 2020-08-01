package messaging

import (
	"backend/internal/collector"
	"log"
)

type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	inbound chan *InboundPayload

	// Register requests from the clients.
	register chan *Client

	// Message size stats
	collector *collector.Collector

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub(collector *collector.Collector) *Hub {
	return &Hub{
		inbound:    make(chan *InboundPayload),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		collector:  collector,
	}
}

func (h *Hub) run() {
	for {
		select {

		case client := <-h.register:
			h.clients[client] = true
			messages, err := h.collector.Read()
			if err != nil {
				log.Printf("Failed to read from log: %v", err)
			} else {
				h.sendPlayback(client, messages)
			}

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.inbound:
			h.collector.Sink <- message.Payload
			for client := range h.clients {
				if client != message.Source {
					h.sendMessage(client, *message.Payload)
				}
			}
		}
	}
}

func (h *Hub) sendMessage(client *Client, message []byte) {
	select {

	case client.send <- message:

	default: // If the send channel buffer is full, close the client.
		log.Printf("Send channel is full, disconnecting client.")
		h.unregisterClient(client)
	}
}

func (h *Hub) sendPlayback(client *Client, messages [][]byte) {
	select {

	case client.playback <- messages:

	default: // If the playback channel buffer is full, close the client.
		log.Printf("Playback channel is full, disconnecting client.")
		h.unregisterClient(client)
	}
}

func (h *Hub) unregisterClient(client *Client) {
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
}
