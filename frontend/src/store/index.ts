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
  store: (svg: string) => void;
  index: () => void;
}

export default class Store implements StoreInterface {
  constructor() {}

  async store(json: string) {
    console.log(json);
    return callService("/api/vector/", {
      store: {
        filename: "saved.json",
        content: json,
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
