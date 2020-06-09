function eventCoordinates(evt) {
  return [evt.clientX, evt.clientY];
}

class Touches {
  constructor() {
    this.down = {};
  }

  set(id) {
    this.down[id] = true;
  }

  has(id) {
    return true && this.down[id];
  }

  delete(id) {
    delete this.down[id];
  }
}

export default class TouchList {
  constructor({
    onTouchDown,
    onTouchMove,
    onTouchHover,
    onTouchUp,
    onTouchCancel,
  }) {
    this.touches = new Touches();
    this.onTouchDown = onTouchDown;
    this.onTouchMove = onTouchMove;
    this.onTouchUp = onTouchUp;
    this.onTouchHover = onTouchHover;
    this.onTouchCancel = onTouchCancel;
  }

  down(evt) {
    const id = event.pointerId;
    const data = [eventCoordinates(evt)];
    this.touches.set(id);
    this.onTouchDown({ id, data });
  }

  up(evt) {
    const id = event.pointerId;
    const data = [eventCoordinates(evt)];
    this.touches.delete(id);
    this.onTouchUp({ id, data });
  }

  move(evt) {
    const id = event.pointerId;
    const data = [eventCoordinates(evt)];
    if (this.touches.has(id)) {
      this.onTouchMove({ id, data });
    } else {
      this.onTouchHover({ id, data });
    }
  }

  cancel(evt) {
    const id = event.pointerId;
    if (this.touches.has(id)) {
      delete this.touches[id];
      this.onTouchCancel({ id });
    }
  }
}
