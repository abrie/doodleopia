function PointTransformer(svg) {
  const point = svg.createSVGPoint();

  return ([x, y]) => {
    [point.x, point.y] = [x, y];
    const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
    return [transformed.x, transformed.y];
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

function createSvgElement(width, height) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  setSvgViewBox(element, 0, 0, width, height);
  return element;
}

export default class Canvas {
  constructor({ target, pointerEventHandlers }) {
    this.workingCanvas = createSvgElement(1600, 900);
    this.finishedCanvas = createSvgElement(1600, 900);
    this.cursorCanvas = createSvgElement(1600, 900);

    this.transformCoordinates = new PointTransformer(this.workingCanvas);

    this.target = target;
    target.appendChild(this.workingCanvas);
    target.appendChild(this.finishedCanvas);
    target.appendChild(this.cursorCanvas);

    this.attachPointerEventHandlers(pointerEventHandlers);
  }

  attachPointerEventHandlers({
    onPointerDown,
    onPointerUp,
    onPointerMove,
    onPointerCancel,
  }) {
    this.target.addEventListener(
      "pointerdown",
      (evt) => {
        stopPrevent(evt);
        const { pointerId: id } = evt;
        const data = this.transformCoordinates(eventCoordinates(evt));
        onPointerDown({ id, data });
      },
      false
    );

    this.target.addEventListener(
      "pointerup",
      (evt) => {
        stopPrevent(evt);
        const { pointerId: id } = evt;
        const data = this.transformCoordinates(eventCoordinates(evt));
        onPointerUp({ id, data });
      },
      false
    );

    document.addEventListener(
      "pointerup",
      (evt) => {
        stopPrevent(evt);
        const { pointerId: id } = evt;
        const data = this.transformCoordinates(eventCoordinates(evt));
        onPointerUp({ id, data });
      },
      false
    );

    this.target.addEventListener(
      "pointercancel",
      (evt) => {
        stopPrevent(evt);
        const { pointerId: id } = evt;
        onPointerCancel({ id });
      },
      false
    );

    this.target.addEventListener(
      "pointermove",
      (evt) => {
        stopPrevent(evt);
        const { pointerId: id } = evt;
        const data = this.transformCoordinates(eventCoordinates(evt));
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
