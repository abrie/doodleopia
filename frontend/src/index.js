import TouchList from "./TouchList.js";
import Polylines from "./Polylines.js";
import Paths from "./Paths.js";
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
  onCanceledPolyline: ({ canceled }) => {
    workingCanvas.removeChild(canceled);
  },
});

const paths = new Paths({
  onNewPath: ({ id, data }) => polylines.startPolyline({ id, data }),
  onFinishedPath: ({ id, data }) => polylines.finishPolyline({ id, data }),
  onUpdatedPath: ({ id, data }) => polylines.updatePolyline({ id, data }),
  onCancledPath: ({ id }) => polylines.cancelPath({ id }),
  pathProcessor: (arr) => rdpSimplify(arr, 2),
});

const touches = new TouchList({
  onTouchDown: ({ id, data }) => {
    paths.startPath({ id, data: data.map(transformPoint) });
  },
  onTouchUp: ({ id, data }) => {
    paths.finishPath({ id, data: data.map(transformPoint) });
  },
  onTouchMove: ({ id, data }) => {
    paths.updatePath({ id, data: data.map(transformPoint) });
  },
  onTouchCancel: ({ id }) => {
    paths.cancelPath({ id });
  },
});

canvas.addEventListener("pointerdown", (evt) => touches.down(evt), false);
canvas.addEventListener("pointerup", (evt) => touches.up(evt), false);
document.addEventListener("pointerup", (evt) => touches.up(evt), false);
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
