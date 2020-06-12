import type { Coordinate } from "../coordinates";

type PenId = number;
type DownMap = Record<PenId, boolean>;

class DownTracker {
  down: DownMap = {};

  set(id: PenId) {
    this.down[id] = true;
  }

  has(id: PenId): boolean {
    return true && this.down[id];
  }

  delete(id: PenId) {
    delete this.down[id];
  }
}

export interface PenTrackerEventHandler {
  onPenDown: ({ id: PenId, data: Coordinate }) => void;
  onPenMove: ({ id: PenId, data: Coordinate }) => void;
  onPenHover: ({ id: PenId, data: Coordinate }) => void;
  onPenUp: ({ id: PenId, data: Coordinate }) => void;
  onPenCancel: ({ id: PenId }) => void;
}

interface PenTrackerInterface {
  down: ({ id: PenId, data: Coordinate }) => void;
  up: ({ id: PenId, data: Coordinate }) => void;
  move: ({ id: PenId, data: Coordinate }) => void;
  cancel: ({ id: PenId }) => void;
}

export default class PenTracker implements PenTrackerInterface {
  downTracker: DownTracker = new DownTracker();
  eventHandler: PenTrackerEventHandler;

  constructor(eventHandler: PenTrackerEventHandler) {
    this.eventHandler = eventHandler;
  }

  down({ id, data }) {
    this.downTracker.set(id);
    this.eventHandler.onPenDown({ id, data });
  }

  up({ id, data }) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onPenUp({ id, data });
    }
  }

  move({ id, data }) {
    if (this.downTracker.has(id)) {
      this.eventHandler.onPenMove({ id, data });
    } else {
      this.eventHandler.onPenHover({ id, data });
    }
  }

  cancel({ id }) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onPenCancel({ id });
    }
  }
}
