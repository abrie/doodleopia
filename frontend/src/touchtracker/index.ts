import type { Coordinate } from "../coordinates";

type TouchId = number;
type DownMap = Record<TouchId, boolean>;

class DownTracker {
  down: DownMap = {};

  set(id: TouchId) {
    this.down[id] = true;
  }

  has(id: TouchId): boolean {
    return true && this.down[id];
  }

  delete(id: TouchId) {
    delete this.down[id];
  }
}

export interface TouchTrackerEventHandler {
  onTouchDown: ({ id: TouchId, data: Coordinate }) => void;
  onTouchMove: ({ id: TouchId, data: Coordinate }) => void;
  onTouchHover: ({ id: TouchId, data: Coordinate }) => void;
  onTouchUp: ({ id: TouchId, data: Coordinate }) => void;
  onTouchCancel: ({ id: TouchId }) => void;
}

interface TouchTrackerInterface {
  down: ({ id: TouchId, data: Coordinate }) => void;
  up: ({ id: TouchId, data: Coordinate }) => void;
  move: ({ id: TouchId, data: Coordinate }) => void;
  cancel: ({ id: TouchId }) => void;
}

export default class TouchTracker implements TouchTrackerInterface {
  downTracker: DownTracker = new DownTracker();
  eventHandler: TouchTrackerEventHandler;

  constructor(eventHandler: TouchTrackerEventHandler) {
    this.eventHandler = eventHandler;
  }

  down({ id, data }) {
    this.downTracker.set(id);
    this.eventHandler.onTouchDown({ id, data });
  }

  up({ id, data }) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onTouchUp({ id, data });
    }
  }

  move({ id, data }) {
    if (this.downTracker.has(id)) {
      this.eventHandler.onTouchMove({ id, data });
    } else {
      this.eventHandler.onTouchHover({ id, data });
    }
  }

  cancel({ id }) {
    if (this.downTracker.has(id)) {
      this.downTracker.delete(id);
      this.eventHandler.onTouchCancel({ id });
    }
  }
}
