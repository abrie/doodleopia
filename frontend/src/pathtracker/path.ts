import { Coordinate } from "../coordinates";
import { PathProcessor } from "../pathprocessor";

export type PathConstructorParams = {
  id: number;
  raw: Coordinate[];
  data: Coordinate[];
  processor: PathProcessor;
};

export default class Path {
  id: number;
  raw: Coordinate[];
  data: Coordinate[];
  processor: PathProcessor;

  constructor(params: PathConstructorParams) {
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
