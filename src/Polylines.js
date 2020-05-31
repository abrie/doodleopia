export default class Polylines {
  constructor({ transformPoint, onNewPolyline }) {
    this.polylines = [];
    this.transformPoint = transformPoint;
    this.onNewPolyline = onNewPolyline;
  }

  get currentPolyline() {
    return this.polylines[this.polylines.length - 1];
  }

  newPolyline(arr) {
    function Polyline() {
      const xmlns = 'http://www.w3.org/2000/svg';
      const polyline = document.createElementNS(xmlns, 'polyline');
      polyline.setAttributeNS(null, 'points', '');
      polyline.setAttributeNS(null, 'fill', 'none');
      polyline.setAttributeNS(null, 'stroke', 'black');
      return polyline;
    }

    this.polylines.push(new Polyline());
    this.updatePolyline(arr);
    this.onNewPolyline(this.currentPolyline);
  }

  updatePolyline(arr) {
    const points = eventsToPoints(arr, this.transformPoint);
    this.currentPolyline.setAttributeNS(null, 'points', points);
  }
}

function eventsToPoints(arr, transformer) {
  return arr
    .map((datum) => {
      const [x, y] = transformer(datum.x, datum.y);
      return `${x},${y}`;
    })
    .join(' ');
}
