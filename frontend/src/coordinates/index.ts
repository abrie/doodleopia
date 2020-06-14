export type Attribution = string;
export type Coordinate = [number, number];

export interface AttributedCoordinate {
  id: Attribution;
  data?: Coordinate;
}

export interface AttributedCoordinates {
  id: Attribution;
  data?: Coordinate[];
}

export type CoordinateTransformer = (Coordinate) => Coordinate;

export function SVGCoordinateTransformer(
  svg: SVGSVGElement
): CoordinateTransformer {
  const point = svg.createSVGPoint();

  return ([x, y]: Coordinate) => {
    [point.x, point.y] = [x, y];
    const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
    return <Coordinate>[transformed.x, transformed.y];
  };
}
