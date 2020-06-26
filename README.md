# Doodleopia

Yet another collaborative drawing app, born from the [2020 Pandemic](https://en.wikipedia.org/wiki/COVID-19_pandemic).

## Features/Shortcomings

- SVG with no canvas intermediate.
- Shared cursors for collaborative feedback.
- Zoomable.
- Continuous 'Recording' of drawings with playback.
- ['Turtle'](https://en.wikipedia.org/wiki/Turtle_graphics) and a 2d [L-systems](https://en.wikipedia.org/wiki/L-system) interpreter (hidden feature).

# Implementation Details

- Go backend using [Gorilla for websockets](https://www.gorillatoolkit.org/pkg/websocket).
- Vanilla Typescript frontend, no framework.
- Uses [FlatBuffers](https://google.github.io/flatbuffers/) for messaging.
- Uses [Snowpack](https://snowpack.dev) for frontend dev. (cool)

## See also

- https://wbo.ophir.dev/
- https://excalidraw.com/
- https://doodledocs.com
- https://multiuser-sketchpad.glitch.me
- https://hundredrabbits.github.io/Noodle/
- https://www.whiteborb.com/FFqmdOXEVM

## Addendum

Try this link to try the app: [https://doodleopia.com](https://doodleopia:letmein@doodleopia.com?ref=github)
