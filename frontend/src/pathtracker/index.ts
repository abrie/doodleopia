import {
  Coordinate,
  AttributedCoordinate,
  AttributedCoordinates,
  Attribution,
} from "../coordinates";
import { Path, PathConstructor } from "./path";

export interface PathTrackerEventHandler {
  onFinishedPath: (path: AttributedCoordinates) => void;
  onNewPath: (path: AttributedCoordinates) => void;
  onCanceledPath: (path: AttributedCoordinates) => void;
  onUpdatedPath: (path: AttributedCoordinates) => void;
  onCreatedPath: (path: AttributedCoordinates) => void;
}

interface PathTrackerInterface {
  startPath: (a: AttributedCoordinate) => void;
  updatePath: (a: AttributedCoordinate) => void;
  finishPath: (a: AttributedCoordinate) => void;
  cancelPath: (a: AttributedCoordinate) => void;
  createPath: (a: AttributedCoordinates) => void;
}

export default class PathTracker implements PathTrackerInterface {
  eventHandler: PathTrackerEventHandler;
  paths: Record<Attribution, Path> = {};

  constructor(eventHandler: PathTrackerEventHandler) {
    this.eventHandler = eventHandler;
  }

  startPath({ id, data }: AttributedCoordinate) {
    const constructor: PathConstructor = {
      id,
      data: [data],
    };

    const path = new Path(constructor);
    this.paths[id] = path;
    this.eventHandler.onNewPath(path);
  }

  updatePath({ id, data }: AttributedCoordinate) {
    const path = this.paths[id];
    if (path) {
      path.pushCoordinate(data);
      this.eventHandler.onUpdatedPath(path);
    }
  }

  finishPath(a: AttributedCoordinate) {
    this.updatePath(a);
    this.eventHandler.onFinishedPath(this.paths[a.id]);
  }

  createPath({ id, data }: AttributedCoordinates) {
    const constructor: PathConstructor = {
      id,
      data: data,
    };

    const path = new Path(constructor);
    this.eventHandler.onCreatedPath(path);
  }

  cancelPath({ id }: AttributedCoordinate) {
    this.eventHandler.onCanceledPath(this.paths[id]);
    delete this.paths[id];
  }
}
