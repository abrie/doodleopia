type Coordinate = [number, number];
type CoordinateTransformer = (Coordinate) => Coordinate;
function SVGCoordinateTransformer(svg: SVGSVGElement): CoordinateTransformer {
  const point = svg.createSVGPoint();

  return ([x, y]: Coordinate) => {
    [point.x, point.y] = [x, y];
    const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
    return <Coordinate>[transformed.x, transformed.y];
  };
}

function stopPrevent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}

function eventCoordinates(evt) {
  return [evt.clientX, evt.clientY];
}

function setSvgViewBox(svg, top, left, width, height) {
  svg.setAttribute("viewBox", `${top} ${left} ${width} ${height}`);
}

function createSvgElement(width: number, height: number): SVGSVGElement {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  setSvgViewBox(element, 0, 0, width, height);
  return element;
}

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

interface PointerEventHandlers {
  onPointerDown: ({ id: number, data: Coordinate }) => void;
  onPointerUp: ({ id: number, data: Coordinate }) => void;
  onPointerMove: ({ id: number, data: Coordinate }) => void;
  onPointerCancel: ({ id: number }) => void;
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

    this.attachPointerEventHandlers(
      target,
      pointerEventHandlers,
      SVGCoordinateTransformer(this.workingCanvas)
    );
  }

  attachPointerEventHandlers(
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
