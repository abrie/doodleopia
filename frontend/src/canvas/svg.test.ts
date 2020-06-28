import { zoomViewBox, scaleValue } from "./svg";
import type { ViewBox } from "./svg";

test("scaleValue works as expected", () => {
  expect(scaleValue([0, 100, 50], [0.5, 2, 1], 50)).toEqual(1);
  expect(scaleValue([0, 100, 50], [0.5, 2, 1], 25)).toEqual(0.75);
  expect(scaleValue([0, 100, 50], [0.5, 2, 1], 75)).toEqual(1.5);
  expect(scaleValue([0, 100, 50], [0.5, 2, 1], 1)).toEqual(0.51);
  expect(scaleValue([0, 100, 50], [0.5, 2, 1], 99)).toEqual(1.98);
});

test("zoomViewBox zooms in correctly", () => {
  const baseViewBox: ViewBox = {
    top: 0,
    left: 0,
    width: 1900,
    height: 600,
  };

  const zoomedViewBox = zoomViewBox(baseViewBox, 2, 0, 0);

  const expected = {
    left: -950,
    top: -300,
    width: 3800,
    height: 1200,
  };

  expect(zoomedViewBox).toEqual(expected);
});

test("zoomViewBox zooms out correctly", () => {
  const baseViewBox: ViewBox = {
    top: 0,
    left: 0,
    width: 1900,
    height: 600,
  };

  const zoomedViewBox = zoomViewBox(baseViewBox, 0.5, 0, 0);

  const expected = {
    left: 475,
    top: 150,
    width: 950,
    height: 300,
  };

  expect(zoomedViewBox).toEqual(expected);
});
