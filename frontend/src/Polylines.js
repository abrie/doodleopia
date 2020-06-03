export default class Polylines {
  constructor({
    onFinishedPolyline,
    onNewPolyline,
    onCancelPolyline,
    pathProcessor,
  }) {
    this.onNewPolyline = onNewPolyline;
    this.onFinishedPolyline = onFinishedPolyline;
    this.onCancelPolyline = onCancelPolyline;
    this.processPath = pathProcessor;
    this.polyline = undefined;
  }

  startPolyline(arr) {
    this.polyline = new Polyline();
    this.updatePolyline(arr);
    this.onNewPolyline(this.polyline);
  }

  finishPolyline(arr) {
    const finished = new Polyline();
    const points = this.processPath(arr).map(coordToString);
    finished.setAttributeNS(null, "points", points);
    this.onFinishedPolyline({ original: this.polyline, finished });
  }

  updatePolyline(arr) {
    const points = this.processPath(arr).map(coordToString);
    this.polyline.setAttributeNS(null, "points", points);
  }

  cancelPolyline() {
    this.onCancelPolyline({ canceled: this.polyline });
  }
}

function coordToString([x, y]) {
  return `${x},${y}`;
}

function Polyline() {
  const xmlns = "http://www.w3.org/2000/svg";
  const polyline = document.createElementNS(xmlns, "polyline");
  polyline.setAttributeNS(null, "points", "");
  polyline.setAttributeNS(null, "fill", "none");
  polyline.setAttributeNS(null, "stroke", "black");
  polyline.setAttributeNS(null, "stroke-linejoin", "arcs");
  return polyline;
}
