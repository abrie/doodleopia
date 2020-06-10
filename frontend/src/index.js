import Touches from "./Touches.js";
import Polylines from "./Polylines.js";
import Paths from "./Paths.js";
import Canvas from "./Canvas.js";
import Turtle from "./turtle.js";
import radialSimplify from "./algorithms/RadialDistance.js";
import rdpSimplify from "./algorithms/RamerDouglasPeucker.js";
import simplify from "./algorithms/PassThrough.js";
import callService from "./service.js";
import Messages from "./messages.js";
import Cursors from "./Cursors.js";
import { v4 as uuidv4 } from "uuid";

const clientId = uuidv4();
const workingCanvas = document.getElementById("working");
const finishedCanvas = document.getElementById("finished");
const cursorCanvas = document.getElementById("cursors");

const messages = new Messages({
  onOpen: () => {
    console.log("connection open");
    startProgram();
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

const turtle = new Turtle({
  onTurtleDown: ({ id, data }) => touches.down({ id, data }),
  onTurtleMove: ({ id, data }) => touches.move({ id, data }),
  onTurtleUp: ({ id, data }) => touches.up({ id, data }),
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

messages.open();

function startProgram() {
  turtle.down();
  turtle.turn(45);
  for (let step = 0; step < 100; step++) {
    turtle.forward(Math.random() * 20);
    turtle.turn(Math.random() * 10 - 5);
  }
  turtle.up();
}
