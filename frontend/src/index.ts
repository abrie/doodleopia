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

const pathRecord: AttributedCoordinates[] = [];

const messages = new Messages(<MessagesEventHandler>{
  onOpen: () => console.log("connection open"),
  onClose: () => console.log("connection closed"),
  onError: () => console.log("connection error"),
  onMessage: (message) => processMessage(message),
});

const cursorTracker = new CursorTracker(<CursorTrackerEventHandler>{
  onNewCursor: (cursor) => canvas.addCursor(cursor),
  onDeadCursor: (cursor) => canvas.removeCursor(cursor),
});

const polylines = new Polylines(<PolylineEventHandler>{
  onNewPolyline: (polyline) => canvas.startPolyline(polyline),
  onFinishedPolyline: (polyline) => canvas.finishPolyline(polyline),
  onCanceledPolyline: (polyline) => canvas.cancelPolyline(polyline),
  onCreatedPolyline: (polyline) => canvas.createPolyline(polyline),
});

const pathTracker = new PathTracker({
  pathProcessor: pathProcessor,
  eventHandler: <PathTrackerEventHandler>{
    onNewPath: ({ id, data }: AttributedCoordinates) => {
      polylines.startPolyline({ id, data });
    },
    onFinishedPath: ({ id, data }: AttributedCoordinates) => {
      polylines.finishPolyline({ id, data });
      pathRecord.push({ id, data });
    },
    onUpdatedPath: ({ id, data }: AttributedCoordinates) => {
      polylines.updatePolyline({ id, data });
    },
    onCanceledPath: ({ id }: AttributedCoordinates) => {
      polylines.cancelPolyline({ id });
    },
    onCreatedPath: ({ id, data }: AttributedCoordinates) => {
      polylines.createPolyline({ id, data });
    },
  },
});

const canvas = new Canvas({
  target: document.getElementById("canvas"),
  pointerEventHandler: <PointerEventHandler>{
    onPointerDown: (a: AttributedCoordinate) => penTracker.down(a),
    onPointerUp: (a: AttributedCoordinate) => penTracker.up(a),
    onPointerMove: (a: AttributedCoordinate) => penTracker.move(a),
    onPointerCancel: (a: AttributedCoordinate) => penTracker.cancel(a),
  },
});

const penTracker = new PenTracker(<PenTrackerEventHandler>{
  onPenDown: (a: AttributedCoordinate) => {
    pathTracker.startPath(a);
    messages.send({
      action: "down",
      ...a,
    });
  },
  onPenUp: (a: AttributedCoordinate) => {
    pathTracker.finishPath(a);
    messages.send({
      action: "up",
      ...a,
    });
  },
  onPenMove: (a: AttributedCoordinate) => {
    pathTracker.updatePath(a);
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
    cursorTracker.local = a.data;
    messages.send({
      action: "cursor",
      ...a,
    });
  },
  onPenCancel: (a: AttributedCoordinate) => {
    pathTracker.cancelPath(a);
    messages.send({ action: "cancel", ...a });
  },
});

const lsystem = new LSystem(<TurtleEventHandler>{
  onTurtleDown: (a: AttributedCoordinate) => penTracker.down(a),
  onTurtleMove: (a: AttributedCoordinate) => penTracker.move(a),
  onTurtleUp: (a: AttributedCoordinate) => penTracker.up(a),
});

function processMessage({ clientId, action, id, data }: Message) {
  const attributedCoordinate: AttributedCoordinate = {
    id: `${clientId}.${id}`,
    data: data,
  };
  switch (action) {
    case "down":
      pathTracker.startPath(attributedCoordinate);
      break;
    case "up":
      pathTracker.finishPath(attributedCoordinate);
      break;
    case "move":
      pathTracker.updatePath(attributedCoordinate);
      break;
    case "cancel":
      pathTracker.cancelPath(attributedCoordinate);
      break;
    case "cursor":
      cursorTracker.updateCursor(clientId, data);
      break;
    default:
      console.log(`Unknown message action: ${action}`);
  }
}

document.addEventListener("keyup", (event) => {
  console.log(event.keyCode);
  if (event.keyCode === 75) {
    // 'k'
    lsystem.run("koch", { point: cursorTracker.local, angle: 0, distance: 2 });
  }
  if (event.keyCode === 83) {
    // 's'
    lsystem.run("sierpinski", {
      point: cursorTracker.local,
      angle: 0,
      distance: 2,
    });
  }
  if (event.keyCode === 70) {
    // 'f'
    lsystem.run("fern", {
      point: cursorTracker.local,
      angle: 180,
      distance: 10,
    });
  }
  if (event.keyCode === 68) {
    // 'd'
    lsystem.run("dragon", {
      point: cursorTracker.local,
      angle: 0,
      distance: 10,
    });
  }
});

function run() {
  const store = new Store();

  store.index().then((index) => {
    const els = index.filenames.map((filename) => {
      const el = document.createElement("option");
      el.setAttribute("value", filename);
      el.text = filename;
      return el;
    });
    els.forEach((el) => document.getElementById("selector").appendChild(el));
  });

  messages.open();

  document
    .getElementById("zoom")
    .addEventListener(
      "input",
      (evt) =>
        (canvas.zoom = parseFloat((evt.target as HTMLInputElement).value))
    );

  document
    .getElementById("store-button")
    .addEventListener("click", () => store.store(JSON.stringify(pathRecord)));

  document
    .getElementById("selector")
    .addEventListener("change", ({ target: { value } }) => {
      pathRecord.length = 0;
      store.get(value).then((paths) =>
        paths.forEach((path) => {
          pathRecord.push(path);
          pathTracker.createPath(path);
        })
      );
    });
}

run();
