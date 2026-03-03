// Base URL for FastAPI backend
const API_BASE_URL = 'https://audrina-subultimate-ghostily.ngrok-free.dev';

/**
 * Generic helper for calling backend APIs.
 * @param {string} path - Endpoint path, e.g. '/items'
 * @param {RequestInit} [options] - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiFetch(path, options = {}) {
  const url = API_BASE_URL + path;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `API error ${response.status} ${response.statusText}: ${errorText}`,
    );
  }

  // Try JSON first, fall back to text
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

