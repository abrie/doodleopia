export default class {
  constructor({ onMessage, onClose, onError, onOpen }) {
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.onError = onError;
    this.onOpen = onOpen;
  }

  get url() {
    const protocol = document.location.protocol === "http:" ? "ws:" : "wss:";
    return protocol + "//" + document.location.host + "/api/message";
  }

  open() {
    this.conn = new WebSocket(this.url);
    this.conn.onopen = (evt) => this.onOpen && this.onOpen();
    (this.conn.onmessage = ({ data }) => {
      if (this.onMessage) {
        data
          .split("\n")
          .map((msg) => JSON.parse(msg))
          .forEach((msg) => this.onMessage(msg));
      }
    }),
      (this.conn.onerror = (evt) => this.onError && this.onError());
    this.conn.onclose = (evt) => this.onClose && this.onClose();
  }

  send(data) {
    if (this.conn) {
      try {
        this.conn.send(JSON.stringify(data));
      } catch (err) {
        console.error(
          `Error trying to send data: "${err.name}":"${err.message}"`
        );
      }
    }
  }
}
