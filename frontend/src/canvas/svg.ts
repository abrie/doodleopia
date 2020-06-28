export interface ViewBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function scaleZoom(
  domain: [number, number, number],
  range: [number, number, number],
  val: number
): number {
  const [minDomain, maxDomain, midDomain] = domain;
  const [minRange, maxRange, midRange] = range;
  if (val == midDomain) {
    return midRange;
  }
  if (val < midDomain) {
    const p = (val - minDomain) / (midDomain - minDomain);
    return p * (midRange - minRange) + minRange;
  }
  if (val > midDomain) {
    const p = (val - midDomain) / (maxDomain - midDomain);
    return p * (maxRange - midRange) + midRange;
  }
}

export function zoomViewBox(
  viewBox: ViewBox,
  factor: number,
  panX: number,
  panY: number
): ViewBox {
  const width = viewBox.width * factor;
  const height = viewBox.height * factor;
  const left = (viewBox.width - viewBox.width * factor) / 2 + panX;
  const top = (viewBox.height - viewBox.height * factor) / 2 + panY;

  return <ViewBox>{
    left,
    top,
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
