import Turtle from "./turtle.js";

class Generator {
  constructor({ axiom, rules, angle, distance }) {
    this.axiom = axiom;
    this.rules = rules;
    this.angle = angle;
    this.distance = distance;
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

  *actions(turtle) {
    for (var idx = 0; idx < this.string.length; idx++) {
      switch (this.string[idx]) {
        case "F":
          yield () => turtle.forward(this.distance);
          break;
        case "G":
          yield () => turtle.forward(this.distance);
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

export default class {
  constructor({ onTurtleDown, onTurtleMove, onTurtleUp }) {
    this.turtle = new Turtle({
      onTurtleDown,
      onTurtleMove,
      onTurtleUp,
    });
  }

  loadProgram({ axiom, rules, iterations, angle, distance }) {
    return new Promise((resolve, reject) => {
      const generator = new Generator({ axiom, rules, angle, distance });
      for (var i = 0; i < iterations; i++) {
        generator.iterate();
      }
      resolve(generator);
    });
  }

  run(point, generator) {
    this.turtle.move(point);
    this.turtle.down();
    for (let action of generator.actions(this.turtle)) {
      action();
    }
    this.turtle.up();
  }
}
