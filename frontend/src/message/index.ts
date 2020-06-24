import type {
  Coordinate,
  Attribution,
  AttributedCoordinate,
} from "../coordinates";

import { message as FlatbufferMessage } from "./message_generated";

export { FlatbufferMessage };

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
