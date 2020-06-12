import { Coordinate } from "../coordinates";

export type CursorTrackerEventHandler = {
  onNewCursor: (cursor: SVGElement) => void;
  onDeadCursor: (cursor: SVGElement) => void;
};

interface CursorTrackerInterface {
  updateCursor: (clientId: string, Coordinate) => void;
}

export default class CursorTracker implements CursorTrackerInterface {
  eventHandler: CursorTrackerEventHandler;
  cursors: Record<string, SVGElement> = {};
  localCursor: Coordinate = [0, 0];

  constructor(eventHandler: CursorTrackerEventHandler) {
    this.eventHandler = eventHandler;
  }

  get local() {
    return this.localCursor;
  }

  set local([x, y]) {
    this.localCursor = [x, y];
  }

  updateCursor(clientId, [x, y]) {
    if (this.cursors[clientId]) {
      const cursor = this.cursors[clientId];
      cursor.setAttributeNS(null, "cx", x);
      cursor.setAttributeNS(null, "cy", y);
    } else {
      const cursor = CreateCursor();
      cursor.setAttributeNS(null, "cx", x);
      cursor.setAttributeNS(null, "cy", y);
      this.cursors[clientId] = cursor;
      this.eventHandler.onNewCursor(cursor);
    }
  }
}

function CreateCursor(): SVGElement {
  const xmlns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(xmlns, "circle");
  el.setAttributeNS(null, "cx", "0");
  el.setAttributeNS(null, "cy", "0");
  el.setAttributeNS(null, "r", "10");
  return el;
}
