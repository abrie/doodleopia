import type { Coordinate } from "../coordinates";
import Message, { buildFlatbuffer, readFlatbuffer } from "../message";

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
  clientId: number = Math.floor(Math.random() * 65535);
  eventHandler: MessagesEventHandler;
  conn: WebSocket;
  sent: ArrayBuffer;
  timerId: number | undefined;

  constructor(eventHandler: MessagesEventHandler) {
    this.eventHandler = eventHandler;
  }

  get url() {
    const protocol = document.location.protocol === "http:" ? "ws:" : "wss:";
    return protocol + "//" + document.location.host + "/api/message";
  }

  open() {
    window.clearTimeout(this.timerId);
    this.conn = new WebSocket(this.url);
    this.conn.binaryType = "arraybuffer";

    this.conn.onopen = (evt) => {
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

    this.conn.onmessage = (evt) => {
      this.receive(evt.data);
    };
  }

  get isOpen() {
    return this.conn && this.conn.readyState === 1; // OPEN
  }

  send(payload) {
    if (this.isOpen) {
      const buf = buildFlatbuffer({ clientId: this.clientId, ...payload });
      this.conn.send(buf);
    }
  }

  receive(incoming: ArrayBuffer) {
    const buf = new Uint8Array(incoming);
    if (this.eventHandler.onMessage) {
      const message = readFlatbuffer(buf);
      this.eventHandler.onMessage(message);
    }
  }
}
