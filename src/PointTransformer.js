export default function PointTransformer(svg) {
  const point = svg.createSVGPoint();

  return ([x, y]) => {
    [point.x, point.y] = [x, y];
    const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
    return [transformed.x, transformed.y];
  };
}
