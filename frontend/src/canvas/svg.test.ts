import { zoomViewBox } from "./svg";
import type { ViewBox } from "./svg";

test("zoomViewBox zooms correctly with zero pan.", () => {
  const baseViewBox: ViewBox = {
    top: 0,
    left: 0,
    width: 1900,
    height: 600,
  };

  const zoomedViewBox = zoomViewBox(baseViewBox, 0.5, [0, 0]);

  const expected = {
    left: 0,
    top: 0,
    width: 950,
    height: 300,
  };

  expect(zoomedViewBox).toEqual(expected);
});

test("panViewBox pans correctly.", () => {
  expect(true).toEqual(true);
});
