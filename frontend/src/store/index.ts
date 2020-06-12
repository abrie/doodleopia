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
}

export default class Store implements StoreInterface {
  constructor() {}

  store(svg: string) {
    callService("/api/vector/", {
      filename: "content.svg",
      svg,
      json: "jsoncontent",
    }).then(() => console.log("stored"));
  }
}
