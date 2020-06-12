import { Coordinate } from "../coordinates";
import radialSimplify from "./algorithms/RadialDistance.js";
import rdpSimplify from "./algorithms/RamerDouglasPeucker.js";
import simplify from "./algorithms/PassThrough.js";

export type PathProcessor = (input: Coordinate[]) => Coordinate[];

export const pathProcessor: PathProcessor = (arr: Coordinate[]) =>
  rdpSimplify(arr, 2);
