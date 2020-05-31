import TouchList from "./TouchList.js";
import Polylines from "./Polylines.js";
import PointTransformer from "./PointTransformer.js";

const workingCanvas = document.getElementById("working");
const finishedCanvas = document.getElementById("finished");
const transformPoint = new PointTransformer(workingCanvas);

const polylines = new Polylines({
  onNewPolyline: (polyline) => workingCanvas.appendChild(polyline),
  onFinishedPolyline: ({ original, finished }) => {
    workingCanvas.removeChild(original);
    finishedCanvas.appendChild(finished);
  },
  onCancelPolyline: ({ canceled }) => {
    workingCanvas.removeChild(canceled);
  },
});

const touches = new TouchList({
  onTouchDown: (arr) => {
    polylines.startPolyline(arr.map(transformPoint));
  },
  onTouchUp: (arr) => {
    polylines.finishPolyline(arr.map(transformPoint));
  },
  onTouchMove: (arr) => {
    polylines.updatePolyline(arr.map(transformPoint));
  },
  onTouchCancel: (arr) => {
    polylines.cancelPolyline();
  },
});

canvas.addEventListener("pointerdown", (evt) => touches.down(evt), false);
canvas.addEventListener("pointerup", (evt) => touches.up(evt), false);
canvas.addEventListener("pointercancel", (evt) => touches.cancel(evt), false);
canvas.addEventListener("pointermove", (evt) => touches.move(evt), false);
