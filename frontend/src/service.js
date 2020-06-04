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

export default function callService(url, args) {
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
    .catch((err) => throw new Error(`Service failed: '${err}'`));
}
