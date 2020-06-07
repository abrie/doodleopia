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
    messages.send({
      action: "down",
      clientId,
      id,
      data: data.map(transformPoint),
    });
  },
  onTouchUp: ({ id, data }) => {
    localPaths.finishPath({ id, data: data.map(transformPoint) });
    messages.send({
      action: "up",
      clientId,
      id,
      data: data.map(transformPoint),
    });
  },
  onTouchMove: ({ id, data }) => {
    localPaths.updatePath({ id, data: data.map(transformPoint) });
    messages.send({
      action: "move",
      clientId,
      id,
      data: data.map(transformPoint),
    });
  },
  onTouchCancel: ({ id }) => {
    localPaths.cancelPath({ id });
    messages.send({ action: "cancel", clientId, id });
  },
});

function processMessage({ clientId: remoteId, action, id, data }) {
  if (clientId == remoteId) {
    return;
  }

  switch (action) {
    case "down":
      remotePaths.startPath({ id, data });
      break;
    case "up":
      remotePaths.finishPath({ id, data });
      break;
    case "move":
      remotePaths.updatePath({ id, data });
      break;
    case "cancel":
      remotePaths.cancelPath({ id });
      break;
    default:
      console.log(`Unknown message action: ${action}`);
  }
}

function store() {
  const el = document.getElementById("finished");
  const serialized = new XMLSerializer().serializeToString(el);

  callService("/api/vector/", {
    filename: "content.svg",
    svg: serialized,
    json: "jsoncontent",
  })
    .then(() => console.log("stored"))
    .catch((err) => console.error(err));
}

function stopPrevent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}

canvas.addEventListener(
  "pointerdown",
  (evt) => {
    stopPrevent(evt);
    touches.down(evt);
  },
  false
);

canvas.addEventListener(
  "pointerup",
  (evt) => {
    stopPrevent(evt);
    touches.up(evt);
  },
  false
);

document.addEventListener(
  "pointerup",
  (evt) => {
    stopPrevent(evt);
    touches.up(evt);
  },
  false
);

canvas.addEventListener(
  "pointercancel",
  (evt) => {
    stopPrevent(evt);
    touches.cancel(evt);
  },
  false
);

canvas.addEventListener(
  "pointermove",
  (evt) => {
    stopPrevent(evt);
    touches.move(evt);
  },
  false
);

document.getElementById("send-button").addEventListener("click", () => store());

messages.open();
