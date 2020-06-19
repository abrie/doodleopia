import Turtle, { TurtleEventHandler, TurtleState } from "../turtle";
import { fractals } from "./fractals";

class Generator {
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  string: string;
  stack: TurtleState[];

  constructor({ axiom, rules, angle }) {
    this.axiom = axiom;
    this.rules = rules;
    this.angle = angle;
    this.string = `${axiom}`;
    this.stack = [];
  }

  iterate() {
    this.string = this.string
      .split("")
      .map((ch) => (this.rules[ch] ? this.rules[ch] : ch))
      .join("");
  }

  get program() {
    return this.string;
  }

  *actions(turtle, { distance }) {
    for (var idx = 0; idx < this.string.length; idx++) {
      switch (this.string[idx]) {
        case "F":
        case "G":
          yield () => turtle.forward(distance);
          break;
        case "+":
          yield () => turtle.turn(this.angle);
          break;
        case "-":
          yield () => turtle.turn(this.angle * -1);
          break;
        case "[":
          yield () => this.stack.push(turtle.state);
          break;
        case "]":
          yield () => (turtle.state = this.stack.pop());
          break;
        default:
          yield () => {};
      }
    }
  }
}

export default class LSystem {
  turtleEventHandler: TurtleEventHandler;
  turtle: Turtle;
  programs: Record<string, Generator> = {};

  constructor(turtleEventHandler: TurtleEventHandler) {
    this.turtle = new Turtle(turtleEventHandler);
    fractals.forEach((def) => this.loadProgram(def));
  }

  loadProgram({ name, axiom, rules, angle, iterations }) {
    return new Promise((resolve, reject) => {
      const generator = new Generator({ axiom, rules, angle });
      for (var i = 0; i < iterations; i++) {
        generator.iterate();
      }
      this.programs[name] = generator;
      resolve(generator);
    });
  }

  run(name, { point, angle, distance }) {
    const generator = this.programs[name];
    this.turtle.setTheta(angle);
    this.turtle.move(point);
    this.turtle.down();
    for (let action of generator.actions(this.turtle, { distance })) {
      action();
    }
    this.turtle.up();
  }
}
