export function setSvgViewBox(
  svg: SVGSVGElement,
  top: number,
  left: number,
  width: number,
  height: number
) {
  svg.setAttribute("viewBox", `${top} ${left} ${width} ${height}`);
}

export function createSvgElement(width: number, height: number): SVGSVGElement {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  setSvgViewBox(element, 0, 0, width, height);
  return element;
}
