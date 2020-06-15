export const fractals = [
  {
    name: "koch",
    axiom: "F+F--F+F",
    rules: { F: "F+F--F+F" },
    angle: 60,
    iterations: 3,
  },
  {
    name: "sierpinski",
    axiom: "F-G-G",
    rules: { F: "F-G+F+G-F", G: "GG" },
    angle: 120,
    iterations: 5,
  },
  {
    name: "fern",
    axiom: "X",
    rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
    angle: 25,
    iterations: 5,
  },
  {
    name: "dragon",
    axiom: "FX",
    rules: { X: "X+YF+", Y: "-FX-Y" },
    angle: 90,
    iterations: 10,
  },
];
