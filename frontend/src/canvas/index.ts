import { SVGCoordinateTransformer, AttributedCoordinate } from "../coordinates";

import {
  PointerEventHandler,
  attachPointerEventHandler,
} from "../pointerevents";
import { createSvgElement, ViewBox, setSvgViewBox, zoomViewBox } from "./svg";

interface CanvasInterface {
  startPolyline: (element: SVGElement) => void;
  createPolyline: (element: SVGElement) => void;
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
  target: HTMLElement;
  workingCanvas: SVGSVGElement = undefined;
  finishedCanvas: SVGSVGElement = undefined;
  cursorCanvas: SVGSVGElement = undefined;
  zoomFactor: number;
  baseViewBox: ViewBox = { left: 0, top: 0, width: 1600, height: 900 };
  viewBox: ViewBox = { ...this.baseViewBox };
  domParser = new DOMParser();
  xmlSerializer = new XMLSerializer();

  constructor({ target, pointerEventHandler }: CanvasConstructor) {
    this.workingCanvas = createSvgElement(this.viewBox);
    this.finishedCanvas = createSvgElement(this.viewBox);
    this.cursorCanvas = createSvgElement(this.viewBox);

    target.appendChild(this.workingCanvas);
    target.appendChild(this.finishedCanvas);
    target.appendChild(this.cursorCanvas);

    this.target = target;

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

  set content(text: string) {
    const dom = this.domParser.parseFromString(text, "image/svg+xml");
    const svg = document.adoptNode(dom.documentElement);
    this.workingCanvas = createSvgElement(this.viewBox);
    this.finishedCanvas = createSvgElement(this.viewBox);
    this.cursorCanvas = createSvgElement(this.viewBox);

    this.finishedCanvas.parentNode.replaceChild(svg, this.finishedCanvas);
  }

  get content(): string {
    return this.xmlSerializer.serializeToString(this.finishedCanvas);
  }

  set zoom(f: number) {
    this.zoomFactor = f;
    this.viewBox = zoomViewBox(this.baseViewBox, f);
    setSvgViewBox(this.workingCanvas, this.viewBox);
    setSvgViewBox(this.finishedCanvas, this.viewBox);
    setSvgViewBox(this.cursorCanvas, this.viewBox);
  }

  get zoom(): number {
    return this.zoomFactor;
  }
}
