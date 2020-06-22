package message

type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	inbound chan []byte

	// Register requests from the clients.
	register chan *Client

	// Message size stats
	statsCollector *StatsCollector

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub(statsCollector *StatsCollector) *Hub {
	return &Hub{
		inbound:        make(chan []byte),
		register:       make(chan *Client),
		unregister:     make(chan *Client),
		clients:        make(map[*Client]bool),
		statsCollector: statsCollector,
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
			h.statsCollector.Sink <- int64(len(message))
			for client := range h.clients {
				h.sendMessage(client, message)
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
