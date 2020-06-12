import { Coordinate } from "../coordinates";
import { PathProcessor } from "../pathprocessor";
import Path, { PathConstructorParams } from "./path";

export interface PathTrackerEventHandler {
  onFinishedPath: (path: Path) => void;
  onNewPath: (path: Path) => void;
  onCanceledPath: (path: Path) => void;
  onUpdatedPath: (path: Path) => void;
}

interface PathTrackerParameter {
  id: number;
  data: Coordinate;
}

export default class PathTracker {
  eventHandler: PathTrackerEventHandler;
  paths: Record<number, Path> = {};
  pathProcessor: PathProcessor;

  constructor(
    eventHandler: PathTrackerEventHandler,
    pathProcessor: PathProcessor
  ) {
    this.eventHandler = eventHandler;
    this.pathProcessor = pathProcessor;
  }

  startPath(params: PathTrackerParameter) {
    const constructorParams: PathConstructorParams = {
      id: params.id,
      raw: [params.data],
      data: [params.data],
      processor: this.pathProcessor,
    };

    const path = new Path(constructorParams);
    this.paths[params.id] = path;
    this.eventHandler.onNewPath(path);
  }

  updatePath(params: PathTrackerParameter) {
    const path = this.paths[params.id];
    if (path) {
      path.pushCoordinate(params.data);
      this.eventHandler.onUpdatedPath(path);
    }
  }

  finishPath({ id, data }) {
    this.updatePath({ id, data });
    this.eventHandler.onFinishedPath(this.paths[id]);
  }

  cancelPath({ id }) {
    this.eventHandler.onCanceledPath(this.paths[id]);
    delete this.paths[id];
  }
}
