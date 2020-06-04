import TouchList from "./TouchList.js";
import Polylines from "./Polylines.js";
import PointTransformer from "./PointTransformer.js";
import radialSimplify from "./algorithms/RadialDistance.js";
import rdpSimplify from "./algorithms/RamerDouglasPeucker.js";
import simplify from "./algorithms/PassThrough.js";
import callService from "./service.js";

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
  pathProcessor: (arr) => rdpSimplify(arr, 2),
});

const touches = new TouchList({
  onTouchDown: ({ id, data }) => {
    polylines.startPolyline({ id, data: data.map(transformPoint) });
  },
  onTouchUp: ({ id, data }) => {
    polylines.finishPolyline({ id, data: data.map(transformPoint) });
  },
  onTouchMove: ({ id, data }) => {
    polylines.updatePolyline({ id, data: data.map(transformPoint) });
  },
  onTouchCancel: ({ id }) => {
    polylines.cancelPolyline({ id });
  },
});

canvas.addEventListener("pointerdown", (evt) => touches.down(evt), false);
canvas.addEventListener("pointerup", (evt) => touches.up(evt), false);
canvas.addEventListener("pointercancel", (evt) => touches.cancel(evt), false);
canvas.addEventListener("pointermove", (evt) => touches.move(evt), false);

document.getElementById("send-button").addEventListener("click", () => store());

function store() {
  const el = document.getElementById("finished");
  const serialized = new XMLSerializer().serializeToString(el);

  callService("/data/vector/", {
    filename: "content.svg",
    svg: serialized,
    json: "jsoncontent",
  })
    .then(() => console.log("stored"))
    .catch((err) => console.error(err));
}
