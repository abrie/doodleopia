import { Coordinate, Attribution, AttributedCoordinates } from "../coordinates";
import { PathProcessor } from "../pathprocessor";

export interface PathConstructor extends AttributedCoordinates {
  raw: Coordinate[];
  processor: PathProcessor;
}

export interface PathInterface extends AttributedCoordinates {
  raw: Coordinate[];
  processor: PathProcessor;
  pushCoordinate: (coordinate: Coordinate) => void;
}

export class Path implements PathInterface {
  id: Attribution;
  data: Coordinate[];
  raw: Coordinate[];
  processor: PathProcessor;

  constructor(params: PathConstructor) {
    this.id = params.id;
    this.raw = params.raw;
    this.data = params.data;
    this.processor = params.processor;
  }

  pushCoordinate(coordinate: Coordinate) {
    this.raw.push(coordinate);
    this.data = this.processor(this.raw);
  }
}
