async function fetchTextOrJson(response) {
  if (typeof response.text === 'function') {
    return response.text();
  }

  if (typeof response.json === 'function') {
    return JSON.stringify(await response.json());
  }

  return '{}';
}

async function fetchWithRetry(fetchImpl, url, options, attempt = 0) {
  try {
    return await fetchImpl(url, options);
  } catch (err) {
    if (attempt >= 1) {
      throw err;
    }

    return fetchWithRetry(fetchImpl, url, options, attempt + 1);
  }
}

module.exports = {
  fetchTextOrJson,
  fetchWithRetry
};
