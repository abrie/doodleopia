package message

type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	inbound chan *InboundMessage

	// Register requests from the clients.
	register chan *Client

	// Message size stats
	collector *Collector

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub(collector *Collector) *Hub {
	return &Hub{
		inbound:    make(chan *InboundMessage),
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

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.inbound:
			h.collector.Sink <- int64(len(*message.Payload))
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
		h.unregisterClient(client)
	}
}

func (h *Hub) unregisterClient(client *Client) {
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
}
