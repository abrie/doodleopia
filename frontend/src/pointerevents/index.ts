import {
  CoordinateTransformer,
  Coordinate,
  AttributedCoordinate,
} from "../coordinates";

function stopPrevent(evt: PointerEvent) {
  evt.stopPropagation();
  evt.preventDefault();
}

function eventCoordinates(evt: PointerEvent): Coordinate {
  return [evt.clientX, evt.clientY];
}

export interface PointerEventHandler {
  onPointerDown: (a: AttributedCoordinate) => void;
  onPointerUp: (a: AttributedCoordinate) => void;
  onPointerMove: (a: AttributedCoordinate) => void;
  onPointerCancel: (a: AttributedCoordinate) => void;
}

function pointerIdToId(pointerId: number) {
  return `${pointerId}`;
}

export function attachPointerEventHandler(
  target: HTMLElement,
  eventHandler: PointerEventHandler,
  transformCoordinates: CoordinateTransformer
) {
  target.addEventListener(
    "pointerdown",
    (evt: PointerEvent) => {
      stopPrevent(evt);
      const id = pointerIdToId(evt.pointerId);
      const data = transformCoordinates(eventCoordinates(evt));
      eventHandler.onPointerDown({ id, data });
    },
    false
  );

  target.addEventListener(
    "pointerup",
    (evt: PointerEvent) => {
      stopPrevent(evt);
      const id = pointerIdToId(evt.pointerId);
      const data = transformCoordinates(eventCoordinates(evt));
      eventHandler.onPointerUp({ id, data });
    },
    false
  );

  document.addEventListener(
    "pointerup",
    (evt: PointerEvent) => {
      stopPrevent(evt);
      const id = pointerIdToId(evt.pointerId);
      const data = transformCoordinates(eventCoordinates(evt));
      eventHandler.onPointerUp({ id, data });
    },
    false
  );

  target.addEventListener(
    "pointercancel",
    (evt: PointerEvent) => {
      stopPrevent(evt);
      const id = pointerIdToId(evt.pointerId);
      eventHandler.onPointerCancel({ id });
    },
    false
  );

  target.addEventListener(
    "pointermove",
    (evt: PointerEvent) => {
      stopPrevent(evt);
      const id = pointerIdToId(evt.pointerId);
      const data = transformCoordinates(eventCoordinates(evt));
      eventHandler.onPointerMove({ id, data });
    },
    false
  );
}
