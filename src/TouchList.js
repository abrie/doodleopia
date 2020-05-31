function copy(evt) {
  return {
    x: evt.clientX,
    y: evt.clientY,
  };
}

export default class TouchList {
  constructor({ onTouchDown, onTouchMove, onTouchUp }) {
    this.touches = {};
    this.onTouchDown = onTouchDown;
    this.onTouchMove = onTouchMove;
    this.onTouchUp = onTouchUp;
  }

  down(evt) {
    this.touches[evt.pointerId] = this.touches[evt.pointerId]
      ? this.touches[evt.pointerId]
      : [];
    this.touches[evt.pointerId].push(copy(evt));
    this.onTouchDown(this.touches[event.pointerId]);
  }

  up(evt) {
    this.touches[evt.pointerId] = this.touches[evt.pointerId]
      ? this.touches[evt.pointerId]
      : [];
    this.onTouchUp(this.touches[event.pointerId]);
    delete this.touches[evt.pointerId];
  }

  move(evt) {
    if (this.touches[evt.pointerId]) {
      this.touches[evt.pointerId].push(copy(evt));
      this.onTouchMove(this.touches[evt.pointerId]);
    }
  }

  cancel(evt) {
    this.touches[evt.pointerId] = this.touches[evt.pointerId]
      ? this.touches[evt.pointerId]
      : [];
    delete this.touches[evt.pointerId];
  }
}
