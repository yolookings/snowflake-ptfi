const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `API request failed with status ${response.status}.`);
  }

  return payload;
}

export function fetchDashboardData() {
  return request("/dashboard");
}
