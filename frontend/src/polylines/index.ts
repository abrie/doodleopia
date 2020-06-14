import { Coordinate, AttributedCoordinates, Attribution } from "../coordinates";

export interface PolylineEventHandler {
  onFinishedPolyline: (el: SVGElement) => void;
  onNewPolyline: (el: SVGElement) => void;
  onCanceledPolyline: (el: SVGElement) => void;
}

export default class Polylines {
  eventHandler: PolylineEventHandler;
  polylines: Record<Attribution, SVGElement> = {};
  constructor(eventHandler: PolylineEventHandler) {
    this.eventHandler = eventHandler;
  }

  startPolyline({ id, data }: AttributedCoordinates) {
    this.polylines[id] = NewPolyline();
    this.updatePolyline({ id, data });
    this.eventHandler.onNewPolyline(this.polylines[id]);
  }

  finishPolyline({ id, data }: AttributedCoordinates) {
    const polyline = this.polylines[id];
    this.eventHandler.onFinishedPolyline(polyline);
    delete this.polylines[id];
  }

  updatePolyline({ id, data }: AttributedCoordinates) {
    this.polylines[id].setAttributeNS(
      null,
      "points",
      data.map(coordToString).join(",")
    );
  }

  cancelPolyline({ id }: AttributedCoordinates) {
    const polyline = this.polylines[id];
    this.eventHandler.onCanceledPolyline(polyline);
    delete this.polylines[id];
  }

  has(id: Attribution) {
    return this.polylines[id] && true;
  }
}

function coordToString([x, y]: Coordinate) {
  return `${x},${y}`;
}

function NewPolyline(): SVGElement {
  const xmlns = "http://www.w3.org/2000/svg";
  const polyline = document.createElementNS(xmlns, "polyline");
  polyline.setAttributeNS(null, "points", "");
  polyline.setAttributeNS(null, "fill", "none");
  polyline.setAttributeNS(null, "stroke", "black");
  polyline.setAttributeNS(null, "stroke-linejoin", "round");
  return polyline;
}
