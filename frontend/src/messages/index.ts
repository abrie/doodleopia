import { v4 as uuidv4 } from "uuid";
import type { Coordinate } from "../coordinates";
import { Message } from "./message";

export { Message };

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
  timerId: number | undefined;

  constructor(eventHandler: MessagesEventHandler) {
    this.eventHandler = eventHandler;
  }

  get url() {
    const protocol = document.location.protocol === "http:" ? "ws:" : "wss:";
    return protocol + "//" + document.location.host + "/api/message";
  }

  open() {
    console.log("Opening connection...");
    this.conn = new WebSocket(this.url);
    this.conn.onopen = (evt) => {
      window.clearTimeout(this.timerId);
      this.eventHandler.onOpen();
    };
    this.conn.onerror = (evt) => {
      this.conn = undefined;
      this.eventHandler.onError();
    };
    this.conn.onclose = (evt) => {
      this.conn = undefined;
      this.timerId = window.setTimeout(() => this.open(), 250);
      this.eventHandler.onClose();
    };
    this.conn.onmessage = (evt) => this.receive(evt.data);
  }

  get isOpen() {
    return this.conn && this.conn.readyState === 1; // OPEN
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
    if (this.isOpen) {
      const message = { ...data, clientId: this.clientId };
      this.conn.send(Message.serialize(message));
    }
  }
}
