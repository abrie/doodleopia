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
    this.polylines = {};
  }

  startPolyline({ id, data }) {
    this.polylines[id] = new Polyline();
    this.updatePolyline({ id, data });
    this.onNewPolyline(this.polylines[id]);
  }

  finishPolyline({ id, data }) {
    const finished = new Polyline();
    finished.setAttributeNS(
      null,
      "points",
      this.processPath(data).map(coordToString)
    );
    this.onFinishedPolyline({ original: this.polylines[id], finished });
    delete this.polylines[id];
  }

  updatePolyline({ id, data }) {
    this.polylines[id].setAttributeNS(
      null,
      "points",
      this.processPath(data).map(coordToString)
    );
  }

  cancelPolyline({ id }) {
    this.onCancelPolyline({ canceled: this.polylines[id] });
    delete this.polylines[id];
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
