import Turtle, { TurtleEventHandler, TurtleState } from "../turtle";

class Generator {
  axiom: string;
  rules: Record<string, string>;
  string: string;
  stack: TurtleState[];

  constructor({ axiom, rules }) {
    this.axiom = axiom;
    this.rules = rules;
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

  *actions(turtle, { angle, distance }) {
    for (var idx = 0; idx < this.string.length; idx++) {
      switch (this.string[idx]) {
        case "F":
        case "G":
          yield () => turtle.forward(distance);
          break;
        case "+":
          yield () => turtle.turn(angle);
          break;
        case "-":
          yield () => turtle.turn(angle * -1);
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

  constructor(turtleEventHandler: TurtleEventHandler) {
    this.turtle = new Turtle(turtleEventHandler);
  }

  loadProgram({ axiom, rules, iterations }) {
    return new Promise((resolve, reject) => {
      const generator = new Generator({ axiom, rules });
      for (var i = 0; i < iterations; i++) {
        generator.iterate();
      }
      resolve(generator);
    });
  }

  run(point, generator, { angle, distance }) {
    this.turtle.move(point);
    this.turtle.down();
    for (let action of generator.actions(this.turtle, { angle, distance })) {
      action();
    }
    this.turtle.up();
  }
}
