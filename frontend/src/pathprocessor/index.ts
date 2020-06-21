import { Coordinate, AttributedCoordinates } from "../coordinates";
import radialSimplify from "./algorithms/RadialDistance.js";
import rdpSimplify from "./algorithms/RamerDouglasPeucker.js";
import simplify from "./algorithms/PassThrough.js";

export type ProcessorFunc = (input: Coordinate[]) => Coordinate[];

export const processPath: ProcessorFunc = (arr: Coordinate[]) =>
  rdpSimplify(arr, 2);

export interface PathProcessorEventHandler {
  onNewPath: (a: AttributedCoordinates) => void;
  onFinishedPath: (a: AttributedCoordinates) => void;
  onUpdatedPath: (a: AttributedCoordinates) => void;
  onCanceledPath: (a: AttributedCoordinates) => void;
  onCreatedPath: (a: AttributedCoordinates) => void;
}

interface PathProcessorInterface {
  startPath: (a: AttributedCoordinates) => void;
  updatePath: (a: AttributedCoordinates) => void;
  finishPath: (a: AttributedCoordinates) => void;
  cancelPath: (a: AttributedCoordinates) => void;
}

export default class PathProcessor implements PathProcessorInterface {
  eventHandler: PathProcessorEventHandler;

  constructor(eventHandler: PathProcessorEventHandler) {
    this.eventHandler = eventHandler;
  }

  startPath({ id, data }: AttributedCoordinates) {
    this.eventHandler.onNewPath({ id, data: processPath(data) });
  }

  finishPath({ id, data }: AttributedCoordinates) {
    this.eventHandler.onFinishedPath({ id, data: processPath(data) });
  }

  updatePath({ id, data }: AttributedCoordinates) {
    this.eventHandler.onUpdatedPath({ id, data: processPath(data) });
  }

  cancelPath(a: AttributedCoordinates) {
    this.eventHandler.onCanceledPath(a);
  }

  createPath({ id, data }: AttributedCoordinates) {
    this.eventHandler.onCreatedPath({ id, data: processPath(data) });
  }
}
