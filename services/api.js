const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

/**
 * Shared fetch wrapper: builds URL, handles non-OK responses, parses JSON.
 * @param {string} path - API path (e.g. '/api/conversations')
 * @param {Record<string, string>} [params] - Query params
 * @returns {Promise<any>} Parsed JSON body
 * @throws {Error} On network failure or non-2xx response (message from server or generic)
 */
async function request(path, params = {}) {
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  let response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    throw new Error(`Network error: ${err.message}`);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(response.ok ? "Invalid JSON response" : text || response.statusText);
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.error || text || response.statusText;
    throw new Error(message || `Request failed (${response.status})`);
  }

  return data ?? {};
}

/**
 * Fetch conversations with pagination.
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {Promise<{ data: any[], total: number, page: number, limit: number }>}
 */
export async function fetchConversations(page = 1, limit = 10) {
  return request("/api/conversations", { page: String(page), limit: String(limit) });
}

/**
 * Fetch messages for a conversation with pagination.
 * @param {string} conversationId
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {Promise<{ data: any[], total: number, page: number, limit: number }>}
 */
export async function fetchMessages(conversationId, page = 1, limit = 10) {
  if (!conversationId) {
    throw new Error("conversationId is required");
  }
  const path = `/api/messages/${encodeURIComponent(conversationId)}`;
  return request(path, { page: String(page), limit: String(limit) });
}

/**
 * Search conversations by query with pagination.
 * @param {string} query
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {Promise<{ data: any[], total: number, page: number, limit: number }>}
 */
export async function searchConversations(query, page = 1, limit = 10) {
  const params = { page: String(page), limit: String(limit) };
  if (query != null && query !== "") {
    params.q = String(query).trim();
  }
  return request("/api/conversations/search", params);
}
