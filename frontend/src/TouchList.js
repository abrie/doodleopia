import { v4 as uuidv4 } from "uuid";

function coordinatesOfEvent(evt) {
  return [evt.clientX, evt.clientY];
}

class PointerIdToUuid {
  constructor() {
    this.lookup = {};
  }

  add({ pointerId }) {
    const uuid = uuidv4();
    this.lookup[pointerId] = uuid;
    return uuid;
  }

  get({ pointerId }) {
    return this.lookup[pointerId];
  }

  delete({ pointerId }) {
    delete this.lookup[pointerId];
  }
}

export default class TouchList {
  constructor({ onTouchDown, onTouchMove, onTouchUp, onTouchCancel }) {
    this.touches = {};
    this.uuids = new PointerIdToUuid();
    this.onTouchDown = onTouchDown;
    this.onTouchMove = onTouchMove;
    this.onTouchUp = onTouchUp;
    this.onTouchCancel = onTouchCancel;
  }

  down(evt) {
    const id = this.uuids.add(evt);
    if (id) {
      this.touches[id] = [];
      this.touches[id].push(coordinatesOfEvent(evt));
      this.onTouchDown({ id, data: this.touches[id] });
    }
  }

  up(evt) {
    const id = this.uuids.get(evt);
    if (id) {
      this.onTouchUp({ id, data: this.touches[id] });
      delete this.touches[id];
      this.uuids.delete(evt);
    }
  }

  move(evt) {
    const id = this.uuids.get(evt);
    if (this.touches[id]) {
      this.touches[id].push(coordinatesOfEvent(evt));
      this.onTouchMove({ id, data: this.touches[id] });
    }
  }

  cancel(evt) {
    const id = this.uuids.get(evt);
    delete this.touches[id];
    this.uuids.delete(evt);
    this.onTouchCancel({ id });
  }
}
