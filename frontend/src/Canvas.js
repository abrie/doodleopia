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

export default class Canvas {
  constructor({
    target,
    canvas,
    onPointerDown,
    onPointerUp,
    onPointerMove,
    onPointerCancel,
  }) {
    this.target = target;
    this.canvas = canvas;
    this.transformCoordinates = new PointTransformer(this.canvas);

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
}
