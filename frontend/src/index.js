import PenTracker, { PenTrackerEventHandler } from "./penTracker";
import Polylines from "./Polylines.js";
import Paths from "./Paths.js";
import Canvas from "./canvas";
import radialSimplify from "./algorithms/RadialDistance.js";
import rdpSimplify from "./algorithms/RamerDouglasPeucker.js";
import simplify from "./algorithms/PassThrough.js";
import callService from "./service.js";
import Messages from "./messages.js";
import Cursors from "./Cursors.js";
import LSystem from "./l-system.js";

const programs = {};

document
  .getElementById("zoom")
  .addEventListener(
    "input",
    (evt) => (canvas.zoom = parseFloat(evt.target.value))
  );

const messages = new Messages({
  onOpen: () => console.log("connection open"),
  onClose: () => console.log("connection closed"),
  onError: () => console.log("connection error"),
  onMessage: (message) => processMessage(message),
});

const cursors = new Cursors({
  onNewCursor: (cursor) => canvas.addCursor(cursor),
  onDeadCursor: (cursor) => canvas.removeCursor(cursor),
});

const polylines = new Polylines({
  onNewPolyline: (polyline) => canvas.startPolyline(polyline),
  onFinishedPolyline: (polyline) => canvas.finishPolyline(polyline),
  onCanceledPolyline: (polyline) => canvas.cancelPolyline(polyline),
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
  pathProcessor: (arr) => rdpSimplify(arr, 1),
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
  pathProcessor: (arr) => rdpSimplify(arr, 1),
});

const pointerEventHandlers = {
  onPointerDown: ({ id, data }) => penTracker.down({ id, data }),
  onPointerUp: ({ id, data }) => penTracker.up({ id, data }),
  onPointerMove: ({ id, data }) => penTracker.move({ id, data }),
  onPointerCancel: ({ id }) => penTracker.cancel({ id }),
};

const canvas = new Canvas({
  target: document.getElementById("canvas"),
  pointerEventHandlers,
});

const penTrackerEventHandler: PenTrackerEventHandler = {
  onPenDown: ({ id, data }) => {
    localPaths.startPath({ id, data });
    messages.send({
      action: "down",
      id,
      data,
    });
  },
  onPenUp: ({ id, data }) => {
    localPaths.finishPath({ id, data });
    messages.send({
      action: "up",
      id,
      data,
    });
  },
  onPenMove: ({ id, data }) => {
    localPaths.updatePath({ id, data });
    messages.send({
      action: "move",
      id,
      data,
    });
    messages.send({
      action: "cursor",
      data,
    });
  },
  onPenHover: ({ id, data }) => {
    cursors.local = data;
    messages.send({
      action: "cursor",
      data,
    });
  },
  onPenCancel: ({ id }) => {
    localPaths.cancelPath({ id });
    messages.send({ action: "cancel", id });
  },
};

const penTracker = new PenTracker(penTrackerEventHandlers);

function processMessage({ clientId, action, id, data }) {
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
      cursors.updateCursor(clientId, data);
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
  console.log(event.keyCode);
  if (event.keyCode === 75) {
    // 'k'
    lsystem.run(cursors.local, programs["koch"]);
  }
  if (event.keyCode === 83) {
    // 's'
    lsystem.run(cursors.local, programs["sierpinski"]);
  }
  if (event.keyCode === 70) {
    // 'f'
    lsystem.run(cursors.local, programs["fern"]);
  }
});

messages.open();

const lsystem = new LSystem({
  onTurtleDown: ({ id, data }) => penTracker.down({ id, data }),
  onTurtleMove: ({ id, data }) => penTracker.move({ id, data }),
  onTurtleUp: ({ id, data }) => penTracker.up({ id, data }),
});

lsystem
  .loadProgram({
    axiom: "F+F--F+F",
    rules: { F: "F+F--F+F" },
    angle: 60,
    distance: 2,
    iterations: 3,
  })
  .then((program) => {
    console.log("koch generated.");
    programs["koch"] = program;
  });

lsystem
  .loadProgram({
    axiom: "F-G-G",
    rules: { F: "F-G+F+G-F", G: "GG" },
    angle: 120,
    distance: 20,
    iterations: 5,
  })
  .then((program) => {
    console.log("sierpinski generated.");
    programs["sierpinski"] = program;
  });

lsystem
  .loadProgram({
    axiom: "X",
    rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
    angle: 25,
    distance: 10,
    iterations: 5,
  })
  .then((program) => {
    console.log("fern generated.");
    programs["fern"] = program;
  });
