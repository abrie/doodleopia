import { AttributedCoordinate, AttributedCoordinates } from "./coordinates";
import Canvas from "./canvas";
import CursorTracker, { CursorTrackerEventHandler } from "./cursorTracker";
import PenTracker, { PenTrackerEventHandler } from "./penTracker";
import Polylines, { PolylineEventHandler } from "./polylines";
import { PointerEventHandler } from "./pointerevents";
import PathTracker, { PathTrackerEventHandler } from "./pathtracker";
import Messages, { MessagesEventHandler, Message } from "./messages";
import Store from "./store";
import { pathProcessor } from "./pathprocessor";
import { TurtleEventHandler } from "./turtle";
import LSystem from "./lsystem";

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
  onMessage: (message) => {
    console.log(message);
    processMessage(message);
  },
};

const messages = new Messages(messagesEventHandler);

const cursorTrackerEventHandler: CursorTrackerEventHandler = {
  onNewCursor: (cursor) => canvas.addCursor(cursor),
  onDeadCursor: (cursor) => canvas.removeCursor(cursor),
};

const cursors = new CursorTracker(cursorTrackerEventHandler);

const polylineEventHandler: PolylineEventHandler = {
  onNewPolyline: (polyline) => canvas.startPolyline(polyline),
  onFinishedPolyline: (polyline) => canvas.finishPolyline(polyline),
  onCanceledPolyline: (polyline) => canvas.cancelPolyline(polyline),
};

const polylines = new Polylines(polylineEventHandler);

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

function processMessage({ clientId, action, id, data }: Message) {
  const attributedCoordinate: AttributedCoordinate = {
    id: `${clientId}.${id}`,
    data: data,
  };
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
      cursors.updateCursor(clientId, data);
      break;
    default:
      console.log(`Unknown message action: ${action}`);
  }
}

document.addEventListener("keyup", (event) => {
  console.log(event.keyCode);
  if (event.keyCode === 75) {
    // 'k'
    lsystem.run(cursors.local, programs["koch"], { angle: 0, distance: 2 });
  }
  if (event.keyCode === 83) {
    // 's'
    lsystem.run(cursors.local, programs["sierpinski"], {
      angle: 0,
      distance: 2,
    });
  }
  if (event.keyCode === 70) {
    // 'f'
    lsystem.run(cursors.local, programs["fern"], { angle: 180, distance: 10 });
  }
  if (event.keyCode === 68) {
    // 'f'
    lsystem.run(cursors.local, programs["dragon"], {
      angle: 0,
      distance: 10,
    });
  }
});

messages.open();

const turtleEventHandler: TurtleEventHandler = {
  onTurtleDown: (a: AttributedCoordinate) => penTracker.down(a),
  onTurtleMove: (a: AttributedCoordinate) => penTracker.move(a),
  onTurtleUp: (a: AttributedCoordinate) => penTracker.up(a),
};

const lsystem = new LSystem(turtleEventHandler);

const programs = {};

lsystem
  .loadProgram({
    axiom: "F+F--F+F",
    rules: { F: "F+F--F+F" },
    angle: 60,
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
    iterations: 5,
  })
  .then((program) => {
    console.log("fern generated.");
    programs["fern"] = program;
  });

lsystem
  .loadProgram({
    axiom: "FX",
    rules: { X: "X+YF+", Y: "-FX-Y" },
    angle: 90,
    iterations: 10,
  })
  .then((program) => {
    console.log("dragon generated.");
    programs["dragon"] = program;
  });
