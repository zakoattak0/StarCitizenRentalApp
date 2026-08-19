const { decodeSession, parseCookies, publicUser, sessionCookie } = require("./auth/_shared");

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function supabaseConfig() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const url = String(rawUrl || "").trim().replace(/\/+$/, "");
  const key = String(rawKey || "").trim();
  const serviceRoleKey = String(rawServiceRoleKey || "").trim();

  if (!url || !key) {
    throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL must be a full URL, for example https://your-project-ref.supabase.co");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("SUPABASE_URL must start with http:// or https://");
  }

  return {
    key,
    serviceRoleKey,
    url,
    host: parsedUrl.host,
  };
}

async function supabaseRequest(path, options = {}) {
  const { useServiceRole = false, headers = {}, ...fetchOptions } = options;
  const { url, key, serviceRoleKey, host } = supabaseConfig();
  const requestKey = useServiceRole && serviceRoleKey ? serviceRoleKey : key;
  let response;

  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...fetchOptions,
      headers: {
        apikey: requestKey,
        authorization: `Bearer ${requestKey}`,
        "content-type": "application/json",
        prefer: "return=representation",
        ...headers,
      },
    });
  } catch (error) {
    const cause = error?.cause;
    const causeDetails = [
      cause?.code,
      cause?.hostname || cause?.host,
      cause?.message,
    ].filter(Boolean).join(" - ");
    const details = causeDetails || error?.message || "network request failed";
    throw new Error(`Unable to reach Supabase at ${host}: ${details}`);
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    if (!response.ok) {
      throw new Error(supabaseHttpErrorMessage(response.status, text, host));
    }
    throw new Error("Supabase returned an invalid JSON response");
  }

  if (!response.ok) {
    const message = payload?.message || payload?.hint || `Supabase returned ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function supabaseHttpErrorMessage(status, text, host) {
  if ([521, 522, 523, 524].includes(status)) {
    return `Supabase is unreachable at ${host} (HTTP ${status}). The project may still be paused, waking up, or temporarily unavailable.`;
  }

  const plainText = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `Supabase returned ${status}${plainText ? `: ${plainText.slice(0, 120)}` : ""}`;
}

function sendJson(response, statusCode, payload) {
  response.setHeader("content-type", "application/json");
  response.status(statusCode).json(payload);
}

function sendError(response, error, fallbackMessage) {
  return sendJson(response, error?.statusCode || 500, {
    error: error instanceof Error ? error.message : fallbackMessage,
  });
}

function canPostWithAccount(user) {
  return Boolean(
    user?.discordId ||
    user?.id?.startsWith("discord:") ||
    (user?.profile?.rsiStatus === "verified" && user.profile.rsiHandle),
  );
}

function requirePostingAccount(request) {
  const session = decodeSession(parseCookies(request)[sessionCookie]);
  const user = publicUser(session);

  if (!canPostWithAccount(user)) {
    throw new ApiError(401, "Create an account with Discord or a verified RSI handle before posting.");
  }

  return user;
}

async function requireOwnedRow(table, id, ownerColumn, userId) {
  const rows = await supabaseRequest(
    `${table}?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(ownerColumn)}`,
    { method: "GET" },
  );
  const row = rows[0];
  if (!row) {
    throw new ApiError(404, "Listing not found");
  }
  if (!userId || row[ownerColumn] !== userId) {
    throw new ApiError(403, "You do not own this listing");
  }
}

async function checkRateLimit(key, limit, windowSeconds) {
  const bucketMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / bucketMs) * bucketMs).toISOString();

  const count = await supabaseRequest("rpc/increment_rate_limit", {
    method: "POST",
    body: JSON.stringify({ p_key: key, p_window_start: windowStart }),
    useServiceRole: true,
  });

  // Opportunistic cleanup so the table doesn't grow unbounded; skips on most calls.
  if (Math.random() < 0.01) {
    supabaseRequest(`rate_limits?window_start=lt.${encodeURIComponent(new Date(Date.now() - 7 * 86400 * 1000).toISOString())}`, {
      method: "DELETE",
      useServiceRole: true,
    }).catch(() => {});
  }

  if (Number(count) > limit) {
    throw new ApiError(429, "Too many requests. Please slow down and try again shortly.");
  }
}

function requestBody(request) {
  if (!request.body) {
    return {};
  }

  return typeof request.body === "string" ? JSON.parse(request.body) : request.body;
}

module.exports = {
  checkRateLimit,
  requireOwnedRow,
  requirePostingAccount,
  requestBody,
  sendError,
  sendJson,
  supabaseRequest,
};
