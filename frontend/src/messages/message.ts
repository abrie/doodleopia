import type { Coordinate, AttributedCoordinate } from "../coordinates";

export interface MessageInterface {
  clientId: string;
  action: string;
  attributedCoordinate: AttributedCoordinate;
}

export class Message implements MessageInterface {
  clientId: string;
  action: string;
  attributedCoordinate: AttributedCoordinate;

  static serialize(message: Message): string {
    return JSON.stringify(message);
  }

  static deserialize(raw: string): Message[] {
    return raw.split("\n").map((msg) => JSON.parse(msg));
  }
}
