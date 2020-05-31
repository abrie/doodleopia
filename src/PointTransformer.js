export default function PointTransformer(svg) {
  const point = svg.createSVGPoint();

  return ({ x, y }) => {
    point.x = x;
    point.y = y;
    const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
    return { x: transformed.x, y: transformed.y };
  };
}
