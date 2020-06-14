import { SVGCoordinateTransformer, AttributedCoordinate } from "../coordinates";

import {
  PointerEventHandler,
  attachPointerEventHandler,
} from "../pointerevents";
import { createSvgElement, setSvgViewBox } from "./svg";

interface CanvasInterface {
  startPolyline: (element: SVGElement) => void;
  finishPolyline: (element: SVGElement) => void;
  cancelPolyline: (element: SVGElement) => void;
  addCursor: (element: SVGElement) => void;
  removeCursor: (element: SVGElement) => void;
}

interface CanvasConstructor {
  target: HTMLElement;
  pointerEventHandler: PointerEventHandler;
}

export default class Canvas implements CanvasInterface {
  workingCanvas: SVGSVGElement = undefined;
  finishedCanvas: SVGSVGElement = undefined;
  cursorCanvas: SVGSVGElement = undefined;
  zoomFactor: number;

  constructor({ target, pointerEventHandler }: CanvasConstructor) {
    this.workingCanvas = createSvgElement(1600, 900);
    this.finishedCanvas = createSvgElement(1600, 900);
    this.cursorCanvas = createSvgElement(1600, 900);

    target.appendChild(this.workingCanvas);
    target.appendChild(this.finishedCanvas);
    target.appendChild(this.cursorCanvas);

    attachPointerEventHandler(
      target,
      pointerEventHandler,
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

  cancelPolyline(el: SVGElement): void {
    this.workingCanvas.removeChild(el);
  }

  addCursor(el: SVGElement): void {
    this.cursorCanvas.appendChild(el);
  }

  removeCursor(el: SVGElement): void {
    this.cursorCanvas.removeChild(el);
  }

  set zoom(f: number) {
    this.zoomFactor = f;
    const width = 1600 * f;
    const height = 900 * f;
    setSvgViewBox(this.workingCanvas, 0, 0, width, height);
    setSvgViewBox(this.finishedCanvas, 0, 0, width, height);
    setSvgViewBox(this.cursorCanvas, 0, 0, width, height);
  }

  get zoom(): number {
    return this.zoomFactor;
  }

  get svg(): string {
    return new XMLSerializer().serializeToString(this.finishedCanvas);
  }
}
