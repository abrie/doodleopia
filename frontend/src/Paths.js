export default class Paths {
  constructor({
    onFinishedPath,
    onNewPath,
    onCanceledPath,
    onUpdatedPath,
    pathProcessor,
  }) {
    this.onNewPath = onNewPath;
    this.onFinishedPath = onFinishedPath;
    this.onUpdatedPath = onUpdatedPath;
    this.onCanceledPath = onCanceledPath;
    this.pathProcessor = pathProcessor;
    this.paths = {};
  }

  startPath({ id, data }) {
    this.paths[id] = new Path({
      id,
      raw: data,
      data: data.map(this.pathProcessor),
    });
    this.onNewPath(this.paths[id]);
  }

  updatePath({ id, data }) {
    if (this.paths[id]) {
      const raw = this.paths[id].raw.concat(data);
      this.paths[id].raw = raw;
      this.paths[id].data = raw.map(this.pathProcessor);
      this.onUpdatedPath(this.paths[id]);
    }
  }

  finishPath({ id, data }) {
    this.updatePath({ id, data });
    this.onFinishedPath(this.paths[id]);
  }

  cancelPath({ id }) {
    this.onCanceledPath(this.paths[id]);
    delete this.paths[id];
  }
}

function Path({ id, raw, data }) {
  return { id, raw, data };
}
