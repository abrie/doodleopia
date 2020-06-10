export default class Turtle {
  constructor({ onTurtleDown, onTurtleUp, onTurtleMove }) {
    this.onTurtleDown = onTurtleDown;
    this.onTurtleUp = onTurtleUp;
    this.onTurtleMove = onTurtleMove;

    this.x = 0;
    this.y = 0;
    this.theta = 0;
    this.id = "turtle";
    this.isDown = false;
  }

  down() {
    this.isDown = true;
    this.onTurtleDown({ id: this.id, data: [this.x, this.y] });
  }

  up() {
    this.isDown = false;
    this.onTurtleUp({ id: this.id, data: [this.x, this.y] });
  }

  move([x, y]) {
    this.x = x;
    this.y = y;
    this.onTurtleMove({ id: this.id, data: [this.x, this.y] });
  }

  turn(deg) {
    this.theta += (deg * Math.PI) / 180;
  }

  forward(d) {
    this.x = this.x + Math.cos(this.theta) * d;
    this.y = this.y + Math.sin(this.theta) * d;
    if (this.isDown) {
      this.onTurtleMove({ id: this.id, data: [this.x, this.y] });
    }
  }

  get state() {
    return { position: [this.x, this.y], theta: this.theta };
  }

  set state({ position, theta }) {
    this.theta = theta;
    this.move(position);
  }
}
