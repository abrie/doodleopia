function getSqDist(p1, p2) {
  var dx = p1.x - p2.x,
    dy = p1.y - p2.y;

  return dx * dx + dy * dy;
}

export default function simplify(points, sqTolerance) {
  var prevPoint = points[0],
    newPoints = [prevPoint],
    point;

  for (var i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) newPoints.push(point);

  return newPoints;
}
