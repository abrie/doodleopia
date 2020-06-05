export default class {
  constructor({ onMessage, onClose, onError, onOpen }) {
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.onError = onError;
    this.onOpen = onOpen;
  }

  get url() {
    return "ws://" + document.location.host + "/api/message";
  }

  open() {
    this.conn = new WebSocket(this.url);
    this.conn.onopen = (evt) => this.onOpen && this.onOpen();
    this.conn.onmessage = ({ data }) => this.onMessage && this.onMessage(data);
    this.conn.onerror = (evt) => this.onError && this.onError();
    this.conn.onclose = (evt) => this.onClose && this.onClose();
  }

  send(data) {
    if (this.conn) {
      try {
        this.conn.send(data);
      } catch (err) {
        console.error(
          `Error trying to send data: "${err.name}":"${err.message}"`
        );
      }
    }
  }
}
