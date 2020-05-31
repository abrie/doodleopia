export default class Polylines {
  constructor({ onFinishedPolyline, onNewPolyline, onCancelPolyline }) {
    this.onNewPolyline = onNewPolyline;
    this.onFinishedPolyline = onFinishedPolyline;
    this.onCancelPolyline = onCancelPolyline;
    this.polyline = undefined;
  }

  startPolyline(arr) {
    this.polyline = new Polyline();
    this.updatePolyline(arr);
    this.onNewPolyline(this.polyline);
  }

  finishPolyline(arr) {
    const finished = new Polyline();
    const points = arr.map(({ x, y }) => `${x},${y}`);
    finished.setAttributeNS(null, "points", points);
    this.onFinishedPolyline({ original: this.polyline, finished });
  }

  updatePolyline(arr) {
    const points = arr.map(({ x, y }) => `${x},${y}`);
    this.polyline.setAttributeNS(null, "points", points);
  }

  cancelPolyline() {
    this.onCancelPolyline({ canceled: this.polyline });
  }
}

function Polyline() {
  const xmlns = "http://www.w3.org/2000/svg";
  const polyline = document.createElementNS(xmlns, "polyline");
  polyline.setAttributeNS(null, "points", "");
  polyline.setAttributeNS(null, "fill", "none");
  polyline.setAttributeNS(null, "stroke", "black");
  return polyline;
}
