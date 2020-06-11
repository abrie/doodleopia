import { SVGCoordinateTransformer } from "./coordinates";
import {
  PointerEventHandlers,
  attachPointerEventHandlers,
} from "./pointerEvents";
import { createSvgElement, setSvgViewBox } from "./svg";

interface CanvasInterface {
  workingCanvas: SVGSVGElement;
  finishedCanvas: SVGSVGElement;
  cursorCanvas: SVGSVGElement;
  zoomFactor: Number;
}

interface CanvasConstructorParams {
  target: HTMLElement;
  pointerEventHandlers: PointerEventHandlers;
}

export default class Canvas implements CanvasInterface {
  workingCanvas: SVGSVGElement = undefined;
  finishedCanvas: SVGSVGElement = undefined;
  cursorCanvas: SVGSVGElement = undefined;
  zoomFactor: number;

  constructor({ target, pointerEventHandlers }: CanvasConstructorParams) {
    this.workingCanvas = createSvgElement(1600, 900);
    this.finishedCanvas = createSvgElement(1600, 900);
    this.cursorCanvas = createSvgElement(1600, 900);

    target.appendChild(this.workingCanvas);
    target.appendChild(this.finishedCanvas);
    target.appendChild(this.cursorCanvas);

    attachPointerEventHandlers(
      target,
      pointerEventHandlers,
      SVGCoordinateTransformer(this.workingCanvas)
    );
  }

  set zoom(f) {
    this.zoomFactor = f;
    const width = 1600 * f;
    const height = 900 * f;
    setSvgViewBox(this.workingCanvas, 0, 0, width, height);
    setSvgViewBox(this.finishedCanvas, 0, 0, width, height);
    setSvgViewBox(this.cursorCanvas, 0, 0, width, height);
  }

  get zoom() {
    return this.zoomFactor;
  }
}
