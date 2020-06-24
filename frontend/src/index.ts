import { AttributedCoordinate, AttributedCoordinates } from "./coordinates";
import Canvas, { CanvasEventHandler } from "./canvas";
import CursorTracker, { CursorTrackerEventHandler } from "./cursortracker";
import PointerTracker, { PointerTrackerEventHandler } from "./pointertracker";
import Polylines, { PolylineEventHandler } from "./polylines";
import PathTracker, { PathTrackerEventHandler } from "./pathtracker";
import Messages, { MessagesEventHandler, Message } from "./messages";
import Store, { StoreEventHandler } from "./store";
import PathProcessor, { PathProcessorEventHandler } from "./pathprocessor";
import { TurtleEventHandler } from "./turtle";
import LSystem from "./lsystem";

function run() {
  messages.open();
  store.restorePathRecord();
  attachUIEventHandlers();
}

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

const pathTracker = new PathTracker(<PathTrackerEventHandler>{
  onNewPath: (a: AttributedCoordinates) => {
    pathProcessor.startPath(a);
  },
  onFinishedPath: (a: AttributedCoordinates) => {
    pathProcessor.finishPath(a);
  },
  onUpdatedPath: (a: AttributedCoordinates) => {
    pathProcessor.updatePath(a);
  },
  onCanceledPath: (a: AttributedCoordinates) => {
    pathProcessor.cancelPath(a);
  },
  onCreatedPath: (a: AttributedCoordinates) => {
    pathProcessor.createPath(a);
  },
});

const pathProcessor = new PathProcessor(<PathProcessorEventHandler>{
  onNewPath: (a: AttributedCoordinates) => {
    polylines.startPolyline(a);
    //messages.send({ action: "start-polyline", ...a });
  },
  onFinishedPath: (a: AttributedCoordinates) => {
    polylines.finishPolyline(a);
    store.pushAttributedCoordinates(a);
    //messages.send({ action: "finish-polyline", ...a });
  },
  onUpdatedPath: (a: AttributedCoordinates) => {
    polylines.updatePolyline(a);
    //messages.send({ action: "update-polyline", ...a });
  },
  onCanceledPath: (a: AttributedCoordinates) => {
    polylines.cancelPolyline(a);
    //messages.send({ action: "cancel-polyline", ...a });
  },
  onCreatedPath: (a: AttributedCoordinates) => {
    polylines.createPolyline(a);
    //messages.send({ action: "create-polyline", ...a });
  },
});

const polylines = new Polylines(<PolylineEventHandler>{
  onNewPolyline: (polyline) => canvas.startPolyline(polyline),
  onFinishedPolyline: (polyline) => canvas.finishPolyline(polyline),
  onCanceledPolyline: (polyline) => canvas.cancelPolyline(polyline),
  onCreatedPolyline: (polyline) => canvas.createPolyline(polyline),
});

const cursorTracker = new CursorTracker(<CursorTrackerEventHandler>{
  onNewCursor: (cursor) => canvas.addCursor(cursor),
  onDeadCursor: (cursor) => canvas.removeCursor(cursor),
});

const store = new Store(<StoreEventHandler>{
  onPathRecord: (path) => pathTracker.createPath(path),
});

const messages = new Messages(<MessagesEventHandler>{
  onOpen: () => showConnectionStatus(true),
  onClose: () => showConnectionStatus(false),
  onError: () => showConnectionStatus(false),
  onMessage: (message) => processMessage(message),
});

function showConnectionStatus(isConnected: boolean) {
  document.getElementById("logo").classList.toggle("connected", isConnected);
}

const lsystem = new LSystem(<TurtleEventHandler>{
  onTurtleDown: (a: AttributedCoordinate) => pointerTracker.down(a),
  onTurtleMove: (a: AttributedCoordinate) => pointerTracker.move(a),
  onTurtleUp: (a: AttributedCoordinate) => pointerTracker.up(a),
});

function messageToAttributedCoordinates({
  clientId,
  id,
  data,
}): AttributedCoordinates {
  return <AttributedCoordinates>{
    id: `${clientId}.${id}`,
    data: data,
  };
}

function messageToAttributedCoordinate({
  clientId,
  id,
  data,
}): AttributedCoordinate {
  return <AttributedCoordinate>{
    id: `${clientId}.${id}`,
    data: data,
  };
}

function processMessage(message: Message) {
  const { action } = message;
  switch (action) {
    /*
    case "start-polyline":
      polylines.startPolyline(messageToAttributedCoordinates(message));
      break;
    case "finish-polyline":
      polylines.finishPolyline(messageToAttributedCoordinates(message));
      break;
    case "update-polyline":
      polylines.updatePolyline(messageToAttributedCoordinates(message));
      break;
    case "cancel-polyline":
      polylines.cancelPolyline(messageToAttributedCoordinates(message));
      break;
      */
    case "clear":
      canvas.clear();
      store.clearPathRecord();
      break;
    case "down":
      pathTracker.startPath(messageToAttributedCoordinate(message));
      break;
    case "up":
      pathTracker.finishPath(messageToAttributedCoordinate(message));
      break;
    case "move":
      pathTracker.updatePath(messageToAttributedCoordinate(message));
      break;
    case "cursor":
      const { clientId, data } = message;
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
    messages.send({
      action: "clear",
    });
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
