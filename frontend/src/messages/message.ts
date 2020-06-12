import type { Coordinate } from "../coordinates";

export class Message {
  clientId: string;
  action: string;
  id: number;
  data: Coordinate;

  static serialize(message: Message): string {
    return JSON.stringify(message);
  }

  static deserialize(raw: string): Message[] {
    return raw.split("\n").map((msg) => JSON.parse(msg));
  }
}
