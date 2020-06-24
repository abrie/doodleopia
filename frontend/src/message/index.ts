import type {
  Coordinate,
  Attribution,
  AttributedCoordinate,
} from "../coordinates";

import { flatbuffers } from "flatbuffers";

import { message as FlatbufferMessage } from "./message_generated";

export const MessageAction = FlatbufferMessage.Action;

export interface MessageInterface extends AttributedCoordinate {
  clientId: string;
  action: FlatbufferMessage.Action;
}

export default class Message implements MessageInterface {
  clientId: string;
  action: FlatbufferMessage.Action;
  id: Attribution;
  data: Coordinate;

  static serialize(message: Message): string {
    return JSON.stringify(message);
  }

  static deserialize(raw: string): Message[] {
    return raw.split("\n").map((msg) => JSON.parse(msg));
  }
}

export function buildFlatbuffer(payload): Uint8Array {
  let builder = new flatbuffers.Builder(100);
  let clientId = builder.createString(payload.clientId);

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

export function readFlatbuffer(payload: Uint8Array) {
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
