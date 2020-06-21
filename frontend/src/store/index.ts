import { AttributedCoordinates } from "../coordinates";

function checkHttpErrors(response) {
  if (!response.ok) {
    return Promise.reject(new Error(response.statusText));
  } else {
    return Promise.resolve(response);
  }
}

function checkResponseErrors(response) {
  if (response.error) {
    return Promise.reject(new Error(response.error));
  } else {
    return Promise.resolve(response);
  }
}

function callService(url, args) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const fetchParams = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(args),
  };

  return fetch(url, fetchParams)
    .then(checkHttpErrors)
    .then((resp) => resp.json())
    .then(checkResponseErrors)
    .catch((err) => new Error(`Service failed: '${err}'`));
}

interface StoreInterface {
  pushAttributedCoordinates: (data: AttributedCoordinates) => void;
  clearPathRecord: () => void;
  restorePathRecord: () => void;
  index: () => void;
}

export interface StoreEventHandler {
  onPathRecord: (attributedCoordinates: AttributedCoordinates) => void;
}

export default class Store implements StoreInterface {
  pathRecord: AttributedCoordinates[] = [];
  eventHandler: StoreEventHandler;

  constructor(eventHandler: StoreEventHandler) {
    this.eventHandler = eventHandler;
  }

  pushAttributedCoordinates(path) {
    this.pathRecord.push(path);
  }

  clearPathRecord() {
    this.pathRecord.length = 0;
  }

  restorePathRecord() {
    this.get("stored.json").then((paths) => {
      this.clearPathRecord();
      paths.forEach((path) => {
        this.pathRecord.push(path);
        this.eventHandler.onPathRecord(path);
      });
    });
  }

  async persistPathRecord() {
    return callService("/api/vector/", {
      store: {
        filename: "stored.json",
        content: JSON.stringify(this.pathRecord),
      },
    });
  }

  async index() {
    return callService("/api/vector/", {
      index: {},
    }).then(({ index }) => index);
  }

  async get(filename): Promise<[]> {
    const fetchParams = {
      method: "GET",
    };

    return fetch(`/api/vector/${filename}`, fetchParams)
      .then(checkHttpErrors)
      .then((response) => response.json());
  }
}
