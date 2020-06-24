import { v4 as uuidv4 } from "uuid";
import type { Coordinate } from "../coordinates";
import { Message } from "./message";

import { message as FlatbufferMessage } from "./message_generated";
import { flatbuffers } from "flatbuffers";

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
      Message.deserialize(data).forEach((message) =>
        this.eventHandler.onMessage(message)
      );
    }
  }

  sendFlatbuffer(payload) {
    let builder = new flatbuffers.Builder(1024);
    FlatbufferMessage.Message.startMessage(builder);

    let clientId = builder.createString(this.clientId);
    FlatbufferMessage.Message.addClientId(builder, clientId);

    let action = ((str) => {
      switch (str) {
        case "up":
          return FlatbufferMessage.Action.Up;
        case "down":
          return FlatbufferMessage.Action.Down;
        case "move":
          return FlatbufferMessage.Action.Move;
        case "clear":
          return FlatbufferMessage.Action.Clear;
        case "cursor":
          return FlatbufferMessage.Action.Cursor;
        default:
          console.error(`Action string does not map to enum: "${str}"`);
      }
    })(payload.action);
    FlatbufferMessage.Message.addAction(builder, action);

    FlatbufferMessage.Message.addId(builder, payload.id);

    let data = FlatbufferMessage.Coordinate.createCoordinate(
      builder,
      payload.data[0],
      payload.data[1]
    );
    FlatbufferMessage.Message.addData(builder, data);

    FlatbufferMessage.Message.endMessage(builder);

    let buf = builder.asUint8Array();
    console.log(buf);
  }

  send(data) {
    this.sendFlatbuffer(data);
    if (this.isOpen) {
      const message = { ...data, clientId: this.clientId };
      this.conn.send(Message.serialize(message));
    }
  }
}
