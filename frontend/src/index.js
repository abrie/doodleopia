import TouchList from "./TouchList.js";
import Polylines from "./Polylines.js";
import Paths from "./Paths.js";
import PointTransformer from "./PointTransformer.js";
import radialSimplify from "./algorithms/RadialDistance.js";
import rdpSimplify from "./algorithms/RamerDouglasPeucker.js";
import simplify from "./algorithms/PassThrough.js";
import callService from "./service.js";
import Messages from "./messages.js";
import { v4 as uuidv4 } from "uuid";

const clientId = uuidv4();
const workingCanvas = document.getElementById("working");
const finishedCanvas = document.getElementById("finished");
const transformPoint = new PointTransformer(workingCanvas);

const messages = new Messages({
  onOpen: () => console.log("connection open"),
  onClose: () => console.log("connection closed"),
  onMessage: (message) => processMessage(message),
  onError: () => console.log("connection error"),
});

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

const localPaths = new Paths({
  onNewPath: ({ id, data }) => {
    polylines.startPolyline({ id, data });
    messages.send(JSON.stringify({ action: "new", clientId, id, data }));
  },
  onFinishedPath: ({ id, data }) => {
    polylines.finishPolyline({ id, data });
    messages.send(JSON.stringify({ action: "finished", clientId, id, data }));
  },
  onUpdatedPath: ({ id, data }) => {
    polylines.updatePolyline({ id, data });
    messages.send(JSON.stringify({ action: "updated", clientId, id, data }));
  },
  onCanceledPath: ({ id }) => {
    polylines.cancelPolyline({ id });
    messages.send(JSON.stringify({ action: "canceled", clientId, id, data }));
  },
  pathProcessor: (arr) => rdpSimplify(arr, 2),
});

const remotePaths = new Paths({
  onNewPath: ({ id, data }) => {
    polylines.startPolyline({ id, data });
  },
  onFinishedPath: ({ id, data }) => {
    polylines.finishPolyline({ id, data });
  },
  onUpdatedPath: ({ id, data }) => {
    polylines.updatePolyline({ id, data });
  },
  onCanceledPath: ({ id }) => {
    polylines.cancelPolyline({ id });
  },
  pathProcessor: (arr) => rdpSimplify(arr, 2),
});

const touches = new TouchList({
  onTouchDown: ({ id, data }) => {
    localPaths.startPath({ id, data: data.map(transformPoint) });
  },
  onTouchUp: ({ id, data }) => {
    localPaths.finishPath({ id, data: data.map(transformPoint) });
  },
  onTouchMove: ({ id, data }) => {
    localPaths.updatePath({ id, data: data.map(transformPoint) });
  },
  onTouchCancel: ({ id }) => {
    localPaths.cancelPath({ id });
  },
});

function processMessage({ clientId: remoteClientId, action, id, data }) {
  if (clientId == remoteClientId) {
    return;
  }

  switch (action) {
    case "new":
      remotePaths.startPath({ id, data });
      break;
    case "finished":
      remotePaths.finishPath({ id, data });
      break;
    case "updated":
      remotePaths.updatePath({ id, data });
      break;
    case "canceled":
      remotePaths.cancelPath({ id });
      break;
    default:
      console.log(`Unknown message action: ${action}`);
  }
}

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

canvas.addEventListener("pointerdown", (evt) => touches.down(evt), false);
canvas.addEventListener("pointerup", (evt) => touches.up(evt), false);
document.addEventListener("pointerup", (evt) => touches.up(evt), false);
canvas.addEventListener("pointercancel", (evt) => touches.cancel(evt), false);
canvas.addEventListener("pointermove", (evt) => touches.move(evt), false);

document.getElementById("send-button").addEventListener("click", () => store());

messages.open();
