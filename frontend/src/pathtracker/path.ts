import { Coordinate, Attribution, AttributedCoordinates } from "../coordinates";

export interface PathConstructor extends AttributedCoordinates {
  data: Coordinate[];
}

export interface PathInterface extends AttributedCoordinates {
  data: Coordinate[];
  pushCoordinate: (coordinate: Coordinate) => void;
}

export class Path implements PathInterface {
  id: Attribution;
  data: Coordinate[];

  constructor(params: PathConstructor) {
    this.id = params.id;
    this.data = params.data;
  }

  pushCoordinate(coordinate: Coordinate) {
    this.data.push(coordinate);
  }
}
