import { v4 as uuidv4 } from "uuid";

function eventCoordinates(evt) {
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
      const data = [eventCoordinates(evt)];
      this.onTouchDown({ id, data });
    }
  }

  up(evt) {
    const id = this.uuids.get(evt);
    if (id) {
      const data = [eventCoordinates(evt)];
      this.onTouchUp({ id, data });
      delete this.touches[id];
      this.uuids.delete(evt);
    }
  }

  move(evt) {
    const id = this.uuids.get(evt);
    if (id) {
      const data = [eventCoordinates(evt)];
      this.onTouchMove({ id, data });
    }
  }

  cancel(evt) {
    const id = this.uuids.get(evt);
    if (id) {
      this.onTouchCancel({ id });
      delete this.touches[id];
      this.uuids.delete(evt);
    }
  }
}
