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
    this.paths[id] = new Path({ id, data: data.map(this.pathProcessor) });
    this.onNewPath(this.paths[id]);
  }

  updatePath({ id, data }) {
    this.paths[id].data = data.map(this.pathProcessor);
    this.onUpdatedPath(this.paths[id]);
  }

  finishPath({ id, data }) {
    this.paths[id].data = data.map(this.pathProcessor);
    this.onFinishedPath(this.paths[id]);
  }

  cancelPath({ id }) {
    this.onCanceledPath(this.paths[id]);
    delete this.paths[id];
  }
}

function Path({ id, data }) {
  return { id, data };
}
