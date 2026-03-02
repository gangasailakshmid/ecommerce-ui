const PROFILE_API_BASE_URL =
  import.meta.env.VITE_PROFILE_API_BASE_URL || "/profile-api/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${PROFILE_API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch (_error) {
    body = bodyText;
  }

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && body.message) ||
      bodyText ||
      response.statusText;
    throw new Error(`Profile API error (${response.status}): ${message}`);
  }

  return body;
}

export function signup(payload) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function signin(payload) {
  return request("/auth/signin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProfile(profileId, payload) {
  return request(`/profiles/${profileId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function changePassword(profileId, payload) {
  return request(`/profiles/${profileId}/password`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
