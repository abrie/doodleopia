export default function PointTransformer(svg) {
  const point = svg.createSVGPoint();
  return (x, y) => {
    point.x = x;
    point.y = y;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    return [svgPoint.x, svgPoint.y];
  };
}
