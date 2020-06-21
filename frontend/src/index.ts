import { AttributedCoordinate, AttributedCoordinates } from "./coordinates";
import Canvas, { CanvasEventHandler } from "./canvas";
import CursorTracker, { CursorTrackerEventHandler } from "./cursortracker";
import PointerTracker, { PointerTrackerEventHandler } from "./pointertracker";
import Polylines, { PolylineEventHandler } from "./polylines";
import PathTracker, { PathTrackerEventHandler } from "./pathtracker";
import Messages, { MessagesEventHandler, Message } from "./messages";
import Store, { StoreEventHandler } from "./store";
import { pathProcessor } from "./pathprocessor";
import { TurtleEventHandler } from "./turtle";
import LSystem from "./lsystem";

function run() {
  messages.open();
  store.restorePathRecord();
  attachUIEventHandlers();
}

const store = new Store(<StoreEventHandler>{
  onPathRecord: (path) => pathTracker.createPath(path),
});

function showConnectionStatus(isConnected: boolean) {
  document.getElementById("logo").classList.toggle("connected", isConnected);
}

const messages = new Messages(<MessagesEventHandler>{
  onOpen: () => showConnectionStatus(true),
  onClose: () => showConnectionStatus(false),
  onError: () => showConnectionStatus(false),
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
    onNewPath: (a: AttributedCoordinates) => {
      polylines.startPolyline(a);
    },
    onFinishedPath: (a: AttributedCoordinates) => {
      polylines.finishPolyline(a);
      store.pushAttributedCoordinates(a);
    },
    onUpdatedPath: (a: AttributedCoordinates) => {
      polylines.updatePolyline(a);
    },
    onCanceledPath: (a: AttributedCoordinates) => {
      polylines.cancelPolyline(a);
    },
    onCreatedPath: (a: AttributedCoordinates) => {
      polylines.createPolyline(a);
    },
  },
});

const canvas = new Canvas({
  target: document.getElementById("canvas"),
  eventHandler: <CanvasEventHandler>{
    onPointerDown: (a: AttributedCoordinate) => pointerTracker.down(a),
    onPointerUp: (a: AttributedCoordinate) => pointerTracker.up(a),
    onPointerMove: (a: AttributedCoordinate) => pointerTracker.move(a),
    onPointerCancel: (a: AttributedCoordinate) => pointerTracker.cancel(a),
  },
});

const pointerTracker = new PointerTracker(<PointerTrackerEventHandler>{
  onPointerDown: (a: AttributedCoordinate) => {
    pathTracker.startPath(a);
    messages.send({
      action: "down",
      ...a,
    });
  },
  onPointerUp: (a: AttributedCoordinate) => {
    pathTracker.finishPath(a);
    messages.send({
      action: "up",
      ...a,
    });
  },
  onPointerMove: (a: AttributedCoordinate) => {
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
  onPointerHover: (a: AttributedCoordinate) => {
    cursorTracker.local = a.data;
    messages.send({
      action: "cursor",
      ...a,
    });
  },
  onPointerCancel: (a: AttributedCoordinate) => {
    pathTracker.cancelPath(a);
    messages.send({ action: "cancel", ...a });
  },
});

const lsystem = new LSystem(<TurtleEventHandler>{
  onTurtleDown: (a: AttributedCoordinate) => pointerTracker.down(a),
  onTurtleMove: (a: AttributedCoordinate) => pointerTracker.move(a),
  onTurtleUp: (a: AttributedCoordinate) => pointerTracker.up(a),
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

function attachUIEventHandlers() {
  document
    .getElementById("zoom")
    .addEventListener(
      "input",
      (evt) =>
        (canvas.zoom = parseFloat((evt.target as HTMLInputElement).value))
    );

  document
    .getElementById("store-button")
    .addEventListener("click", () => store.persistPathRecord());

  document.getElementById("clear-button").addEventListener("click", () => {
    canvas.clear();
    store.clearPathRecord();
  });

  document
    .getElementById("restore-button")
    .addEventListener("click", () => store.restorePathRecord());

  document.addEventListener("keyup", (event) => {
    if (event.keyCode === 75) {
      // 'k'
      lsystem.run("koch", {
        point: cursorTracker.local,
        angle: 0,
        distance: 2,
      });
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
}

run();
