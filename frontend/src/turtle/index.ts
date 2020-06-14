import { Coordinate, AttributedCoordinate, Attribution } from "../coordinates";

export interface TurtleEventHandler {
  onTurtleDown: (a: AttributedCoordinate) => void;
  onTurtleUp: (a: AttributedCoordinate) => void;
  onTurtleMove: (a: AttributedCoordinate) => void;
}

export interface TurtleState {
  position: Coordinate;
  theta: number;
}

interface TurtleInterface {
  eventHandler: TurtleEventHandler;
  down: () => void;
  up: () => void;
  move: (c: Coordinate) => void;
  turn: (a: number) => void;
  forward: (d: number) => void;
  setTheta: (d: number) => void;
  state: TurtleState;
}

export default class Turtle implements TurtleInterface {
  x: number = 0;
  y: number = 0;
  theta: number = 0;
  id: Attribution = "turtle";
  isDown: boolean = false;
  eventHandler: TurtleEventHandler;

  constructor(eventHandler: TurtleEventHandler) {
    this.eventHandler = eventHandler;
  }

  down() {
    this.isDown = true;
    this.eventHandler.onTurtleDown({ id: this.id, data: [this.x, this.y] });
  }

  up() {
    this.isDown = false;
    this.eventHandler.onTurtleUp({ id: this.id, data: [this.x, this.y] });
  }

  move([x, y]: Coordinate) {
    this.x = x;
    this.y = y;
    this.eventHandler.onTurtleMove({ id: this.id, data: [this.x, this.y] });
  }

  turn(deg: number) {
    this.theta += (deg * Math.PI) / 180;
  }

  setTheta(angle) {
    this.theta = angle;
  }

  forward(d: number) {
    this.x = this.x + Math.cos(this.theta) * d;
    this.y = this.y + Math.sin(this.theta) * d;
    if (this.isDown) {
      this.eventHandler.onTurtleMove({ id: this.id, data: [this.x, this.y] });
    }
  }

  get state(): TurtleState {
    return { position: [this.x, this.y], theta: this.theta };
  }

  set state({ position, theta }: TurtleState) {
    this.theta = theta;
    this.move(position);
  }
}
