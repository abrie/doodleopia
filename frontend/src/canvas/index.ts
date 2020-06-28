import { SVGCoordinateTransformer, AttributedCoordinate } from "../coordinates";
import { CoordinateTransformer, Coordinate } from "../coordinates";
import {
  createSvgElement,
  ViewBox,
  setSvgViewBox,
  zoomViewBox,
  scaleZoom,
} from "./svg";

export { scaleZoom };

interface CanvasInterface {
  startPolyline: (element: SVGElement) => void;
  createPolyline: (element: SVGElement) => void;
  finishPolyline: (element: SVGElement) => void;
  cancelPolyline: (element: SVGElement) => void;
  addCursor: (element: SVGElement) => void;
  removeCursor: (element: SVGElement) => void;
}

export interface CanvasEventHandler {
  onPointerDown: (a: AttributedCoordinate) => void;
  onPointerUp: (a: AttributedCoordinate) => void;
  onPointerMove: (a: AttributedCoordinate) => void;
  onPointerCancel: (a: AttributedCoordinate) => void;
}

interface CanvasConstructor {
  target: HTMLElement;
  eventHandler: CanvasEventHandler;
}

export default class Canvas implements CanvasInterface {
  target: HTMLElement;
  workingCanvas: SVGSVGElement = undefined;
  finishedCanvas: SVGSVGElement = undefined;
  cursorCanvas: SVGSVGElement = undefined;
  zoomFactor: number = 1.0;
  panX: number = 0;
  panY: number = 0;
  animationFrameRequest: number = 0;
  baseViewBox: ViewBox = { left: 0, top: 0, width: 1600, height: 900 };
  viewBox: ViewBox = { ...this.baseViewBox };
  domParser = new DOMParser();
  xmlSerializer = new XMLSerializer();

  constructor({ target, eventHandler }: CanvasConstructor) {
    this.workingCanvas = createSvgElement(this.viewBox);
    this.finishedCanvas = createSvgElement(this.viewBox);
    this.cursorCanvas = createSvgElement(this.viewBox);

    target.appendChild(this.workingCanvas);
    target.appendChild(this.finishedCanvas);
    target.appendChild(this.cursorCanvas);

    const el = document.createElement("div");
    el.setAttribute("id", "scroller");
    target.appendChild(el);

    const el2 = document.createElement("div");
    el2.setAttribute("id", "scroll-child");
    el.appendChild(el2);

    el.addEventListener("scroll", (evt) => {
      const target = evt.currentTarget as HTMLDivElement;

      this.panX =
        (target.scrollLeft / target.scrollWidth) * this.baseViewBox.width;
      this.panY =
        (target.scrollTop / target.scrollHeight) * this.baseViewBox.height;
      this.zoom = this.zoomFactor; // Force redraw
    });

    attachEventHandler(
      target,
      eventHandler,
      SVGCoordinateTransformer(this.workingCanvas)
    );
  }

  startPolyline(el: SVGElement): void {
    this.workingCanvas.appendChild(el);
  }

  finishPolyline(el: SVGElement): void {
    this.workingCanvas.removeChild(el);
    this.finishedCanvas.appendChild(el);
  }

  createPolyline(el: SVGElement): void {
    this.finishedCanvas.appendChild(el);
  }

  cancelPolyline(el: SVGElement): void {
    this.workingCanvas.removeChild(el);
  }

  addCursor(el: SVGElement): void {
    this.cursorCanvas.appendChild(el);
  }

  removeCursor(el: SVGElement): void {
    this.cursorCanvas.removeChild(el);
  }

  clear() {
    const blankCanvas = createSvgElement(this.viewBox);
    this.finishedCanvas.replaceWith(blankCanvas);
    this.finishedCanvas = blankCanvas;
  }

  set zoom(f: number) {
    this.zoomFactor = f;
    this.viewBox = zoomViewBox(this.baseViewBox, f, this.panX, this.panY);

    if (this.animationFrameRequest) {
      window.cancelAnimationFrame(this.animationFrameRequest);
    }

    this.animationFrameRequest = window.requestAnimationFrame(() => {
      setSvgViewBox(this.workingCanvas, this.viewBox);
      setSvgViewBox(this.finishedCanvas, this.viewBox);
      setSvgViewBox(this.cursorCanvas, this.viewBox);
      this.animationFrameRequest = undefined;
    });
  }

  get zoom(): number {
    return this.zoomFactor;
  }
}

function attachEventHandler(
  target: HTMLElement,
  eventHandler: CanvasEventHandler,
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

function stopPrevent(evt: PointerEvent) {
  evt.stopPropagation();
  evt.preventDefault();
}

function eventCoordinates(evt: PointerEvent): Coordinate {
  return [evt.clientX, evt.clientY];
}

function pointerIdToId(pointerId: number) {
  return `${pointerId}`;
}
