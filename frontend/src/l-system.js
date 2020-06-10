import Turtle from "./turtle.js";

class Generator {
  constructor({ axiom, rules }) {
    this.axiom = axiom;
    this.rules = rules;
    this.string = `${axiom}`;
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

  *actions(turtle, angle, distance) {
    for (var idx = 0; idx < this.string.length; idx++) {
      switch (this.string[idx]) {
        case "F":
          yield () => turtle.forward(distance);
          break;
        case "+":
          yield () => turtle.turn(angle);
          break;
        case "-":
          yield () => turtle.turn(-angle);
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

  loadProgram({ axiom, rules, iterations, angle }) {
    return new Promise((resolve, reject) => {
      const generator = new Generator({ axiom, rules });
      for (var i = 0; i < iterations; i++) {
        generator.iterate();
      }
      resolve(generator);
    });
  }

  run(point, generator) {
    this.turtle.move(point);
    this.turtle.down();
    for (let action of generator.actions(this.turtle, 60, 2)) {
      action();
    }
    this.turtle.up();
  }
}
