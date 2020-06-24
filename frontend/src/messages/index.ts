import { v4 as uuidv4 } from "uuid";
import type { Coordinate } from "../coordinates";
import Message, { FlatbufferMessage } from "../message";

import { flatbuffers } from "flatbuffers";

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

  buildFlatbuffer(payload): Uint8Array {
    let builder = new flatbuffers.Builder(100);
    let clientId = builder.createString(this.clientId);

    FlatbufferMessage.Message.startMessage(builder);
    FlatbufferMessage.Message.addClientId(builder, clientId);
    FlatbufferMessage.Message.addAction(builder, payload.action);

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

  readFlatbuffer(payload: Uint8Array) {
    let buf = new flatbuffers.ByteBuffer(payload);
    let message = FlatbufferMessage.Message.getRootAsMessage(buf);
    let data = message.data();

    return {
      clientId: message.clientId(),
      id: message.id(),
      action: message.action(),
      data: data ? [data.x(), data.y()] : undefined,
    };
  }

  send(payload) {
    if (this.isOpen) {
      const buf = this.buildFlatbuffer(payload);
      this.conn.send(buf);
    }
  }

  receive(incoming: ArrayBuffer) {
    const buf = new Uint8Array(incoming);
    if (this.eventHandler.onMessage) {
      const message = this.readFlatbuffer(buf);
      this.eventHandler.onMessage(message);
    }
  }
}
