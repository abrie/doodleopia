import { CoordinateTransformer } from "../coordinates";

function stopPrevent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}

function eventCoordinates(evt) {
  return [evt.clientX, evt.clientY];
}

export interface PointerEventHandlers {
  onPointerDown: ({ id: number, data: Coordinate }) => void;
  onPointerUp: ({ id: number, data: Coordinate }) => void;
  onPointerMove: ({ id: number, data: Coordinate }) => void;
  onPointerCancel: ({ id: number }) => void;
}

export function attachPointerEventHandlers(
  target: HTMLElement,
  {
    onPointerDown,
    onPointerUp,
    onPointerMove,
    onPointerCancel,
  }: PointerEventHandlers,
  transformCoordinates: CoordinateTransformer
) {
  target.addEventListener(
    "pointerdown",
    (evt) => {
      stopPrevent(evt);
      const { pointerId: id } = evt;
      const data = transformCoordinates(eventCoordinates(evt));
      onPointerDown({ id, data });
    },
    false
  );

  target.addEventListener(
    "pointerup",
    (evt) => {
      stopPrevent(evt);
      const { pointerId: id } = evt;
      const data = transformCoordinates(eventCoordinates(evt));
      onPointerUp({ id, data });
    },
    false
  );

  document.addEventListener(
    "pointerup",
    (evt) => {
      stopPrevent(evt);
      const { pointerId: id } = evt;
      const data = transformCoordinates(eventCoordinates(evt));
      onPointerUp({ id, data });
    },
    false
  );

  target.addEventListener(
    "pointercancel",
    (evt) => {
      stopPrevent(evt);
      const { pointerId: id } = evt;
      onPointerCancel({ id });
    },
    false
  );

  target.addEventListener(
    "pointermove",
    (evt) => {
      stopPrevent(evt);
      const { pointerId: id } = evt;
      const data = transformCoordinates(eventCoordinates(evt));
      onPointerMove({ id, data });
    },
    false
  );
}
