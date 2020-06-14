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

export interface PenTrackerEventHandler {
  onPenDown: (a: AttributedCoordinate) => void;
  onPenMove: (a: AttributedCoordinate) => void;
  onPenHover: (a: AttributedCoordinate) => void;
  onPenUp: (a: AttributedCoordinate) => void;
  onPenCancel: (a: AttributedCoordinate) => void;
}

interface PenTrackerInterface {
  down: (a: AttributedCoordinate) => void;
  up: (a: AttributedCoordinate) => void;
  move: (a: AttributedCoordinate) => void;
  cancel: (a: AttributedCoordinate) => void;
}

export default class PenTracker implements PenTrackerInterface {
  downTracker: DownTracker = new DownTracker();
  eventHandler: PenTrackerEventHandler;

  constructor(eventHandler: PenTrackerEventHandler) {
    this.eventHandler = eventHandler;
  }

  down({ id, data }: AttributedCoordinate) {
    this.downTracker.set(id);
    this.eventHandler.onPenDown({ id, data });
  }

  up({ id, data }: AttributedCoordinate) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onPenUp({ id, data });
    }
  }

  move({ id, data }: AttributedCoordinate) {
    if (this.downTracker.has(id)) {
      this.eventHandler.onPenMove({ id, data });
    } else {
      this.eventHandler.onPenHover({ id, data });
    }
  }

  cancel({ id }: AttributedCoordinate) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onPenCancel({ id });
    }
  }
}
