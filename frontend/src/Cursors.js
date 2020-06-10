export default class {
  constructor({ onNewCursor, onDeadCursor }) {
    this.onNewCursor = onNewCursor;
    this.onDeadCursor = onDeadCursor;
    this.cursors = {};
    this.localCursor = [0, 0];
  }

  get local() {
    return this.localCursor;
  }

  set local([x, y]) {
    this.localCursor = [x, y];
  }

  updateCursor(clientId, [x, y]) {
    if (this.cursors[clientId]) {
      const cursor = this.cursors[clientId];
      cursor.setAttributeNS(null, "cx", x);
      cursor.setAttributeNS(null, "cy", y);
    } else {
      const cursor = new Cursor();
      cursor.setAttributeNS(null, "cx", x);
      cursor.setAttributeNS(null, "cy", y);
      this.cursors[clientId] = cursor;
      this.onNewCursor(cursor);
    }
  }
}

function Cursor() {
  const xmlns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(xmlns, "circle");
  el.setAttributeNS(null, "cx", "0");
  el.setAttributeNS(null, "cy", "0");
  el.setAttributeNS(null, "r", "10");
  return el;
}
