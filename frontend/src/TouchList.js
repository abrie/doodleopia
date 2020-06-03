function coordinatesOfEvent(evt) {
  return [evt.clientX, evt.clientY];
}

export default class TouchList {
  constructor({ onTouchDown, onTouchMove, onTouchUp, onTouchCancel }) {
    this.touches = {};
    this.onTouchDown = onTouchDown;
    this.onTouchMove = onTouchMove;
    this.onTouchUp = onTouchUp;
    this.onTouchCancel = onTouchCancel;
  }

  down(evt) {
    this.touches[evt.pointerId] = this.touches[evt.pointerId]
      ? this.touches[evt.pointerId]
      : [];
    this.touches[evt.pointerId].push(coordinatesOfEvent(evt));
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
      this.touches[evt.pointerId].push(coordinatesOfEvent(evt));
      this.onTouchMove(this.touches[evt.pointerId]);
    }
  }

  cancel(evt) {
    this.touches[evt.pointerId] = this.touches[evt.pointerId]
      ? this.touches[evt.pointerId]
      : [];
    delete this.touches[evt.pointerId];
    this.onTouchCancel();
  }
}
