import type {
  Coordinate,
  Attribution,
  AttributedCoordinate,
} from "../coordinates";

export interface MessageInterface extends AttributedCoordinate {
  clientId: string;
  action: string;
}

export class Message implements MessageInterface {
  clientId: string;
  action: string;
  id: Attribution;
  data: Coordinate;

  static serialize(message: Message): string {
    return JSON.stringify(message);
  }

  static deserialize(raw: string): Message[] {
    return raw.split("\n").map((msg) => JSON.parse(msg));
  }
}
