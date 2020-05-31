import TouchList from "./TouchList.js";
import Polylines from "./Polylines.js";
import PointTransformer from "./PointTransformer.js";

const canvas = document.getElementById("canvas");
const transformPoint = new PointTransformer(canvas);

const polylines = new Polylines({
  onNewPolyline: (polyline) => canvas.appendChild(polyline),
});

const touches = new TouchList({
  onTouchDown: (arr) => {
    polylines.newPolyline(arr.map(transformPoint));
  },
  onTouchUp: (arr) => {
    polylines.updatePolyline(arr.map(transformPoint));
  },
  onTouchMove: (arr) => {
    polylines.updatePolyline(arr.map(transformPoint));
  },
});

canvas.addEventListener("pointerdown", (evt) => touches.down(evt), false);
canvas.addEventListener("pointerup", (evt) => touches.up(evt), false);
canvas.addEventListener("pointercancel", (evt) => touches.cancel(evt), false);
canvas.addEventListener("pointermove", (evt) => touches.move(evt), false);
