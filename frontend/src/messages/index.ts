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

    this.runTests();
  }

  get url() {
    const protocol = document.location.protocol === "http:" ? "ws:" : "wss:";
    return protocol + "//" + document.location.host + "/api/message";
  }

  open() {
    window.clearTimeout(this.timerId);
    this.conn = new WebSocket(this.url);
    //this.conn.bufferType = "arraybuffer";

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

  receive(data) {
    if (this.eventHandler.onMessage) {
      Message.deserialize(data).forEach((message) =>
        this.eventHandler.onMessage(message)
      );
    }
  }

  stringToAction(str) {
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
  }

  runTests() {
    const payload1 = {
      action: "cursor",
      id: 0,
      data: [112.06227111816406, 528.9884033203125],
    };

    this.testFlatbuffer(payload1);
  }

  testFlatbuffer(payload) {
    const buf = this.buildFlatbuffer(payload);
    const decoded = this.readFlatbuffer(buf);
  }

  buildFlatbuffer(payload) {
    let builder = new flatbuffers.Builder(80);
    let clientId = builder.createString(this.clientId);

    FlatbufferMessage.Message.startMessage(builder);
    FlatbufferMessage.Message.addClientId(builder, clientId);

    let action = this.stringToAction(payload.action);
    FlatbufferMessage.Message.addAction(builder, action);

    FlatbufferMessage.Message.addId(builder, payload.id);

    let data = FlatbufferMessage.Coordinate.createCoordinate(
      builder,
      payload.data[0],
      payload.data[1]
    );
    FlatbufferMessage.Message.addData(builder, data);

    let message = FlatbufferMessage.Message.endMessage(builder);
    FlatbufferMessage.Message.finishMessageBuffer(builder, message);

    return builder.asUint8Array();
  }

  readFlatbuffer(payload) {
    let buf = new flatbuffers.ByteBuffer(payload);
    let message = FlatbufferMessage.Message.getRootAsMessage(buf);
    let data = message.data();
    const result = {
      clientId: message.clientId(),
      id: message.id(),
      action: message.action(),
      data: [message.data().x(), message.data().y()],
    };

    console.log(result);
  }

  send(data) {
    if (this.isOpen) {
      const message = { ...data, clientId: this.clientId };
      this.conn.send(Message.serialize(message));
    }
  }
}
