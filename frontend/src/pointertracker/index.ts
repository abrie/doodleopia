import type {
  Coordinate,
  Attribution,
  AttributedCoordinate,
} from "../coordinates";

type DownMap = Record<Attribution, boolean>;

class DownTracker {
  down: DownMap = {};

  set(id: Attribution) {
    this.down[id] = true;
  }

  has(id: Attribution): boolean {
    return true && this.down[id];
  }

  delete(id: Attribution) {
    delete this.down[id];
  }
}

export interface PointerTrackerEventHandler {
  onPointerDown: (a: AttributedCoordinate) => void;
  onPointerMove: (a: AttributedCoordinate) => void;
  onPointerHover: (a: AttributedCoordinate) => void;
  onPointerUp: (a: AttributedCoordinate) => void;
  onPointerCancel: (a: AttributedCoordinate) => void;
}

interface PointerTrackerInterface {
  down: (a: AttributedCoordinate) => void;
  up: (a: AttributedCoordinate) => void;
  move: (a: AttributedCoordinate) => void;
  cancel: (a: AttributedCoordinate) => void;
}

export default class PointerTracker implements PointerTrackerInterface {
  downTracker: DownTracker = new DownTracker();
  eventHandler: PointerTrackerEventHandler;

  constructor(eventHandler: PointerTrackerEventHandler) {
    this.eventHandler = eventHandler;
  }

  down({ id, data }: AttributedCoordinate) {
    this.downTracker.set(id);
    this.eventHandler.onPointerDown({ id, data });
  }

  up({ id, data }: AttributedCoordinate) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onPointerUp({ id, data });
    }
  }

  move({ id, data }: AttributedCoordinate) {
    if (this.downTracker.has(id)) {
      this.eventHandler.onPointerMove({ id, data });
    } else {
      this.eventHandler.onPointerHover({ id, data });
    }
  }

  cancel({ id }: AttributedCoordinate) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onPointerCancel({ id });
    }
  }
}
