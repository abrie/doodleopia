class DownTracker {
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
    this.downTracker = new DownTracker();
    this.onTouchDown = onTouchDown;
    this.onTouchMove = onTouchMove;
    this.onTouchUp = onTouchUp;
    this.onTouchHover = onTouchHover;
    this.onTouchCancel = onTouchCancel;
  }

  down({ id, data }) {
    this.downTracker.set(id);
    this.onTouchDown({ id, data });
  }

  up({ id, data }) {
    this.downTracker.delete(id);
    this.onTouchUp({ id, data });
  }

  move({ id, data }) {
    if (this.downTracker.has(id)) {
      this.onTouchMove({ id, data });
    } else {
      this.onTouchHover({ id, data });
    }
  }

  cancel({ id }) {
    if (this.downTracker.has(id)) {
      delete this.downTracker[id];
      this.onTouchCancel({ id });
    }
  }
}
