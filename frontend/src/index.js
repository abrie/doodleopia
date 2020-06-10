import Touches from "./Touches.js";
import Polylines from "./Polylines.js";
import Paths from "./Paths.js";
import Canvas from "./Canvas.js";
import radialSimplify from "./algorithms/RadialDistance.js";
import rdpSimplify from "./algorithms/RamerDouglasPeucker.js";
import simplify from "./algorithms/PassThrough.js";
import callService from "./service.js";
import Messages from "./messages.js";
import Cursors from "./Cursors.js";
import LSystem from "./l-system.js";
import { v4 as uuidv4 } from "uuid";

const clientId = uuidv4();
const workingCanvas = document.getElementById("working");
const finishedCanvas = document.getElementById("finished");
const cursorCanvas = document.getElementById("cursors");
var cursor = [0, 0];
const programs = {};

document
  .getElementById("zoom")
  .addEventListener("input", (evt) => zoom(evt.target.value));

const zoom = (f) => {
  const width = 1600 * f;
  const height = 900 * f;
  workingCanvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
  finishedCanvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
  cursorCanvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
};

const messages = new Messages({
  onOpen: () => {
    console.log("connection open");
  },
  onClose: () => console.log("connection closed"),
  onMessage: (message) => processMessage(message),
  onError: () => console.log("connection error"),
});

const cursors = new Cursors({
  onNewCursor: (cursor) => cursorCanvas.appendChild(cursor),
  onDeadCursor: (cursor) => cursorCanvas.removeChild(cursor),
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

const canvas = new Canvas({
  target: document.getElementById("canvas"),
  canvas: document.getElementById("working"),
  onPointerDown: ({ id, data }) => touches.down({ id, data }),
  onPointerUp: ({ id, data }) => touches.up({ id, data }),
  onPointerMove: ({ id, data }) => touches.move({ id, data }),
  onPointerCancel: ({ id }) => touches.cancel({ id }),
});

const touches = new Touches({
  onTouchDown: ({ id, data }) => {
    localPaths.startPath({ id, data });
    messages.send({
      action: "down",
      clientId,
      id,
      data,
    });
  },
  onTouchUp: ({ id, data }) => {
    localPaths.finishPath({ id, data });
    messages.send({
      action: "up",
      clientId,
      id,
      data,
    });
  },
  onTouchMove: ({ id, data }) => {
    localPaths.updatePath({ id, data });
    messages.send({
      action: "move",
      clientId,
      id,
      data,
    });
    messages.send({
      action: "cursor",
      clientId,
      data,
    });
  },
  onTouchHover: ({ id, data }) => {
    cursor = [...data];
    messages.send({
      action: "cursor",
      clientId,
      data,
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
    case "cursor":
      cursors.updateCursor(remoteId, data);
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

document.getElementById("send-button").addEventListener("click", () => store());

document.addEventListener("keyup", (event) => {
  if (event.keyCode === 75) {
    // 'k'
    lsystem.run(cursor, programs["koch"]);
  }
});

messages.open();

const lsystem = new LSystem({
  onTurtleDown: ({ id, data }) => touches.down({ id, data }),
  onTurtleMove: ({ id, data }) => touches.move({ id, data }),
  onTurtleUp: ({ id, data }) => touches.up({ id, data }),
});

lsystem
  .loadProgram({ axiom: "F+F--F+F", rules: { F: "F+F--F+F" }, iterations: 3 })
  .then((program) => {
    console.log("program generated.");
    programs["koch"] = program;
  });
