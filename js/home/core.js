(() => {
  const API_BASE = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "";

  function notify(message, type = "info") {
    if (typeof showToast === "function") {
      showToast(message, type);
      return;
    }
    console.log(`[${type}] ${message}`);
  }

  async function authFetch(path, opts = {}) {
    const res = await fetch(API_BASE + path, {
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      credentials: "include",
      ...opts,
    });

    const contentType = res.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      data = await res.text().catch(() => "");
    }

    if (!res.ok) {
      const msg =
        typeof data === "string"
          ? data || `Loi ${res.status}`
          : data.detail || data.message || `Loi ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  window.homeCore = { API_BASE, notify, authFetch };
  window.API_BASE = API_BASE;
  window.notify = notify;
  window.authFetch = authFetch;
})();
