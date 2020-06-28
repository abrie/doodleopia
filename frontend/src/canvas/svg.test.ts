import { zoomViewBox, panViewBox } from "./svg";
import type { ViewBox } from "./svg";

test("zoomViewBox zooms in correctly.", () => {
  const baseViewBox: ViewBox = {
    top: 0,
    left: 0,
    width: 1900,
    height: 600,
  };

  const zoomedViewBox = zoomViewBox(baseViewBox, 0.5);

  const expected = {
    left: 475,
    top: 150,
    width: 950,
    height: 300,
  };

  expect(zoomedViewBox).toEqual(expected);
});

test("panViewBox pans correctly.", () => {
  const baseViewBox: ViewBox = {
    top: 0,
    left: 0,
    width: 1900,
    height: 600,
  };

  const zoomed = zoomViewBox(baseViewBox, 1);
  const got = panViewBox(baseViewBox, zoomed, 2, 0.5, 0);

  const expected = {
    left: -950,
    top: -300,
    width: 3800,
    height: 1200,
  };

  expect(got).toEqual(expected);
});
