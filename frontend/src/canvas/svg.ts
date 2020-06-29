export interface ViewBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function zoomViewBox(
  viewBox: ViewBox,
  factor: number,
  pan: [number, number]
): ViewBox {
  const width = viewBox.width * factor;
  const height = viewBox.height * factor;
  const left = 0;
  const top = 0;

  const [panX, panY] = pan;
  const dx = viewBox.width * panX;
  const dy = viewBox.height * panY;

  return <ViewBox>{
    left: left + dx,
    top: top + dy,
    width,
    height,
  };
}

export function setSvgViewBox(svg: SVGSVGElement, viewBox: ViewBox) {
  svg.setAttribute(
    "viewBox",
    `${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`
  );
}

export function createSvgElement(viewBox: ViewBox): SVGSVGElement {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  setSvgViewBox(element, viewBox);
  return element;
}

function NewCircle(): SVGElement {
  const xmlns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(xmlns, "circle");
  el.setAttributeNS(null, "cx", "0");
  el.setAttributeNS(null, "cy", "0");
  el.setAttributeNS(null, "r", "50");
  el.setAttributeNS(null, "stroke", "black");
  el.setAttributeNS(null, "stroke-linejoin", "round");
  return el;
}

function NewRect(): SVGElement {
  const xmlns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(xmlns, "rect");
  el.setAttributeNS(null, "x", "0");
  el.setAttributeNS(null, "y", "0");
  el.setAttributeNS(null, "width", "1600");
  el.setAttributeNS(null, "height", "900");
  el.setAttributeNS(null, "fill", "none");
  el.setAttributeNS(null, "stroke", "black");
  el.setAttributeNS(null, "stroke-linejoin", "round");
  return el;
}
