export default class Polylines {
  constructor({ onNewPolyline }) {
    this.onNewPolyline = onNewPolyline;
    this.polyline = undefined;
  }

  newPolyline(arr) {
    this.polyline = new Polyline();
    this.updatePolyline(arr);
    this.onNewPolyline(this.polyline);
  }

  updatePolyline(arr) {
    const points = arr.map(({ x, y }) => `${x},${y}`);
    this.polyline.setAttributeNS(null, "points", points);
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
