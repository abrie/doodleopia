import Canvas from "./canvas";
import CursorTracker, { CursorTrackerEventHandler } from "./cursorTracker";
import PenTracker, { PenTrackerEventHandler } from "./penTracker";
import Polylines from "./Polylines.js";
import PathTracker, { PathTrackerEventHandler } from "./pathtracker";
import callService from "./service.js";
import Messages, { MessagesEventHandler } from "./messages";
import { pathProcessor } from "./pathprocessor";
import LSystem from "./l-system.js";

const programs = {};

document
  .getElementById("zoom")
  .addEventListener(
    "input",
    (evt) => (canvas.zoom = parseFloat((evt.target as HTMLInputElement).value))
  );

const messagesEventHandler: MessagesEventHandler = {
  onOpen: () => console.log("connection open"),
  onClose: () => console.log("connection closed"),
  onError: () => console.log("connection error"),
  onMessage: (message) => processMessage(message),
};

const messages = new Messages(messagesEventHandler);

const cursorTrackerEventHandler: CursorTrackerEventHandler = {
  onNewCursor: (cursor) => canvas.addCursor(cursor),
  onDeadCursor: (cursor) => canvas.removeCursor(cursor),
};

const cursors = new CursorTracker(cursorTrackerEventHandler);

const polylines = new Polylines({
  onNewPolyline: (polyline) => canvas.startPolyline(polyline),
  onFinishedPolyline: (polyline) => canvas.finishPolyline(polyline),
  onCanceledPolyline: (polyline) => canvas.cancelPolyline(polyline),
});

const localPathTrackerEventHandler: PathTrackerEventHandler = {
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
};

const localPathTracker = new PathTracker(
  localPathTrackerEventHandler,
  pathProcessor
);

const remotePathTrackerEventHandler: PathTrackerEventHandler = {
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
};

const remotePathTracker = new PathTracker(
  remotePathTrackerEventHandler,
  pathProcessor
);

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
    localPathTracker.startPath({ id, data });
    messages.send({
      action: "down",
      id,
      data,
    });
  },
  onPenUp: ({ id, data }) => {
    localPathTracker.finishPath({ id, data });
    messages.send({
      action: "up",
      id,
      data,
    });
  },
  onPenMove: ({ id, data }) => {
    localPathTracker.updatePath({ id, data });
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
    localPathTracker.cancelPath({ id });
    messages.send({ action: "cancel", id });
  },
};

const penTracker = new PenTracker(penTrackerEventHandler);

function processMessage({ clientId, action, id, data }) {
  switch (action) {
    case "down":
      remotePathTracker.startPath({ id, data });
      break;
    case "up":
      remotePathTracker.finishPath({ id, data });
      break;
    case "move":
      remotePathTracker.updatePath({ id, data });
      break;
    case "cancel":
      remotePathTracker.cancelPath({ id });
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
