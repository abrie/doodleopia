class TouchList {
  constructor() {
    this.touches = {};
  }

  down(evt) {
    touches[evt.pointerId] = touches[evt.pointerId]
      ? touches[evt.pointerId]
      : [];
    touches[evt.pointerId].push(copy(evt));
    this.onTouchDown(touches[event.pointerId]);
  }

  up(evt) {
    touches[evt.pointerId] = touches[evt.pointerId]
      ? touches[evt.pointerId]
      : [];
    this.onTouchUp(touches[event.pointerId]);
    delete touches[evt.pointerId];
  }

  move(evt) {
    if (touches[evt.pointerId]) {
      touches[evt.pointerId].push(copy(evt));
      this.onTouchMove(touches[evt.pointerId]);
    }
  }

  cancel(evt) {
    touches[evt.pointerId] = touches[evt.pointerId]
      ? touches[evt.pointerId]
      : [];
    delete touches[evt.pointerId];
  }
}

class Polylines {
  constructor() {
    this.polylines = [];
  }

  get currentPolyline() {
    return this.polylines[this.polylines.length - 1];
  }

  newPolyline(arr) {
    function Polyline() {
      const xmlns = "http://www.w3.org/2000/svg";
      const polyline = document.createElementNS(xmlns, "polyline");
      polyline.setAttributeNS(null, "points", "");
      polyline.setAttributeNS(null, "fill", "none");
      polyline.setAttributeNS(null, "stroke", "black");
      return polyline;
    }

    this.polylines.push(new Polyline());
    this.updatePolyline(arr);
    this.onNewPolyline(this.currentPolyline);
  }

  updatePolyline(arr) {
    const points = eventsToPoints(canvas, arr);
    this.currentPolyline.setAttributeNS(null, "points", points);
  }
}

const canvas = document.getElementById("canvas");

canvas.addEventListener("pointerdown", handlePointerDown, false);
canvas.addEventListener("pointerup", handlePointerUp, false);
canvas.addEventListener("pointercancel", handlePointerCancel, false);
canvas.addEventListener("pointermove", handlePointerMove, false);

const touches = new TouchList();
const polylines = new Polylines();

polylines.onNewPolyline = (polyline) => {
  canvas.appendChild(polyline);
};

touches.onTouchDown = (arr) => {
  polylines.newPolyline(arr);
};

touches.onTouchUp = (arr) => {
  polylines.updatePolyline(arr);
};

touches.onTouchMove = (arr) => {
  polylines.updatePolyline(arr);
};

function eventsToPoints(svg, arr) {
  const pt = svg.createSVGPoint();

  return arr
    .map((datum) => {
      pt.x = datum.x;
      pt.y = datum.y;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      return `${svgP.x},${svgP.y}`;
    })
    .join(" ");
}

function copy(evt) {
  return {
    x: evt.clientX,
    y: evt.clientY,
  };
}

function handlePointerDown(evt) {
  touches.down(evt);
}

function handlePointerUp(evt) {
  touches.up(evt);
}

function handlePointerCancel(evt) {
  touches.cancel(evt);
}

function handlePointerMove(evt) {
  touches.move(evt);
}
