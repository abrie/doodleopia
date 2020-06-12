import { v4 as uuidv4 } from "uuid";
import type { Coordinate } from "../coordinates";
import { Message } from "./message";

export type MessagesEventHandler = {
  onOpen: () => void;
  onClose: () => void;
  onError: () => void;
  onMessage: (Message) => void;
};

interface MessagesInterface {
  open: () => void;
  url: string;
  receive: (string) => void;
  send: (Message) => void;
}

export default class implements MessagesInterface {
  clientId: string = uuidv4();
  eventHandler: MessagesEventHandler;
  conn: WebSocket;

  constructor(eventHandler: MessagesEventHandler) {
    this.eventHandler = eventHandler;
  }

  get url() {
    const protocol = document.location.protocol === "http:" ? "ws:" : "wss:";
    return protocol + "//" + document.location.host + "/api/message";
  }

  open() {
    this.conn = new WebSocket(this.url);
    this.conn.onopen = (evt) => this.eventHandler.onOpen();
    this.conn.onerror = (evt) => this.eventHandler.onError();
    this.conn.onclose = (evt) => this.eventHandler.onClose();
    this.conn.onmessage = (evt) => this.receive(evt.data);
  }

  receive(data) {
    if (this.eventHandler.onMessage) {
      const messages = Message.deserialize(data);
      messages
        .filter((message) => message.clientId != this.clientId)
        .forEach((message) => this.eventHandler.onMessage(message));
    }
  }

  send(data) {
    if (this.conn) {
      const message = { ...data, clientId: this.clientId };
      this.conn.send(Message.serialize(message));
    }
  }
}
