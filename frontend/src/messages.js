import { v4 as uuidv4 } from "uuid";

export default class {
  constructor({ onMessage, onClose, onError, onOpen }) {
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.onError = onError;
    this.onOpen = onOpen;
    this.clientId = uuidv4();
  }

  get url() {
    const protocol = document.location.protocol === "http:" ? "ws:" : "wss:";
    return protocol + "//" + document.location.host + "/api/message";
  }

  open() {
    this.conn = new WebSocket(this.url);
    this.conn.onopen = (evt) => this.onOpen && this.onOpen();
    this.conn.onerror = (evt) => this.onError && this.onError();
    this.conn.onclose = (evt) => this.onClose && this.onClose();
    this.conn.onmessage = (evt) => this.receive(evt.data);
  }

  receive(data) {
    if (this.onMessage) {
      const messages = deserializeData(data);
      messages
        .filter((message) => message.clientId != this.clientId)
        .forEach((message) => this.onMessage(message));
    }
  }

  send(data) {
    if (this.conn) {
      const message = { ...data, clientId: this.clientId };
      this.conn.send(serializeData(message));
    }
  }
}

function serializeData(data) {
  return JSON.stringify(data);
}

function deserializeData(raw) {
  return raw.split("\n").map((msg) => JSON.parse(msg));
}
