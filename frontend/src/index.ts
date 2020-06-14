import { AttributedCoordinate, AttributedCoordinates } from "./coordinates";
import Canvas from "./canvas";
import CursorTracker, { CursorTrackerEventHandler } from "./cursorTracker";
import PenTracker, { PenTrackerEventHandler } from "./penTracker";
import Polylines from "./polylines";
import { PointerEventHandler } from "./pointerevents";
import PathTracker, { PathTrackerEventHandler } from "./pathtracker";
import Messages, { MessagesEventHandler, Message } from "./messages";
import Store from "./store";
import { pathProcessor } from "./pathprocessor";
import LSystem from "./l-system.js";

const store = new Store();

document
  .getElementById("zoom")
  .addEventListener(
    "input",
    (evt) => (canvas.zoom = parseFloat((evt.target as HTMLInputElement).value))
  );

document
  .getElementById("send-button")
  .addEventListener("click", () => store.store(canvas.svg));

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
  onNewPath: ({ id, data }: AttributedCoordinates) => {
    polylines.startPolyline({ id, data });
  },
  onFinishedPath: ({ id, data }: AttributedCoordinates) => {
    polylines.finishPolyline({ id, data });
  },
  onUpdatedPath: ({ id, data }: AttributedCoordinates) => {
    polylines.updatePolyline({ id, data });
  },
  onCanceledPath: ({ id }: AttributedCoordinates) => {
    polylines.cancelPolyline({ id });
  },
};

const localPathTracker = new PathTracker(
  localPathTrackerEventHandler,
  pathProcessor
);

const remotePathTrackerEventHandler: PathTrackerEventHandler = {
  onNewPath: ({ id, data }: AttributedCoordinates) => {
    polylines.startPolyline({ id, data });
  },
  onFinishedPath: ({ id, data }: AttributedCoordinates) => {
    polylines.finishPolyline({ id, data });
  },
  onUpdatedPath: ({ id, data }: AttributedCoordinates) => {
    polylines.updatePolyline({ id, data });
  },
  onCanceledPath: ({ id }: AttributedCoordinates) => {
    polylines.cancelPolyline({ id });
  },
};

const remotePathTracker = new PathTracker(
  remotePathTrackerEventHandler,
  pathProcessor
);

const pointerEventHandler: PointerEventHandler = {
  onPointerDown: (a: AttributedCoordinate) => penTracker.down(a),
  onPointerUp: (a: AttributedCoordinate) => penTracker.up(a),
  onPointerMove: (a: AttributedCoordinate) => penTracker.move(a),
  onPointerCancel: (a: AttributedCoordinate) => penTracker.cancel(a),
};

const canvas = new Canvas({
  target: document.getElementById("canvas"),
  pointerEventHandler,
});

const penTrackerEventHandler: PenTrackerEventHandler = {
  onPenDown: (a: AttributedCoordinate) => {
    localPathTracker.startPath(a);
    messages.send({
      action: "down",
      ...a,
    });
  },
  onPenUp: (a: AttributedCoordinate) => {
    localPathTracker.finishPath(a);
    messages.send({
      action: "up",
      ...a,
    });
  },
  onPenMove: (a: AttributedCoordinate) => {
    localPathTracker.updatePath(a);
    messages.send({
      action: "move",
      ...a,
    });
    messages.send({
      action: "cursor",
      ...a,
    });
  },
  onPenHover: (a: AttributedCoordinate) => {
    cursors.local = a.data;
    messages.send({
      action: "cursor",
      ...a,
    });
  },
  onPenCancel: (a: AttributedCoordinate) => {
    localPathTracker.cancelPath(a);
    messages.send({ action: "cancel", ...a });
  },
};

const penTracker = new PenTracker(penTrackerEventHandler);

function processMessage({ clientId, action, attributedCoordinate }: Message) {
  switch (action) {
    case "down":
      remotePathTracker.startPath(attributedCoordinate);
      break;
    case "up":
      remotePathTracker.finishPath(attributedCoordinate);
      break;
    case "move":
      remotePathTracker.updatePath(attributedCoordinate);
      break;
    case "cancel":
      remotePathTracker.cancelPath(attributedCoordinate);
      break;
    case "cursor":
      cursors.updateCursor(clientId, attributedCoordinate.data);
      break;
    default:
      console.log(`Unknown message action: ${action}`);
  }
}

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

const programs = {};

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
