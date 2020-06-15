import {
  Coordinate,
  AttributedCoordinate,
  AttributedCoordinates,
  Attribution,
} from "../coordinates";
import { PathProcessor } from "../pathprocessor";
import { Path, PathConstructor } from "./path";

export interface PathTrackerEventHandler {
  onFinishedPath: (path: AttributedCoordinates) => void;
  onNewPath: (path: AttributedCoordinates) => void;
  onCanceledPath: (path: AttributedCoordinates) => void;
  onUpdatedPath: (path: AttributedCoordinates) => void;
}

interface PathTrackerConstructor {
  eventHandler: PathTrackerEventHandler;
  pathProcessor: PathProcessor;
}

export default class PathTracker {
  eventHandler: PathTrackerEventHandler;
  paths: Record<Attribution, Path> = {};
  pathProcessor: PathProcessor;

  constructor({ eventHandler, pathProcessor }: PathTrackerConstructor) {
    this.eventHandler = eventHandler;
    this.pathProcessor = pathProcessor;
  }

  startPath({ id, data }: AttributedCoordinate) {
    const constructor: PathConstructor = {
      id,
      raw: [data],
      data: [data],
      processor: this.pathProcessor,
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

  cancelPath({ id }: AttributedCoordinate) {
    this.eventHandler.onCanceledPath(this.paths[id]);
    delete this.paths[id];
  }
}
