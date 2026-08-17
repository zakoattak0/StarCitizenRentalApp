function supabaseConfig() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = String(rawUrl || "").trim().replace(/\/+$/, "");
  const key = String(rawKey || "").trim();

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
    url,
    host: parsedUrl.host,
  };
}

async function supabaseRequest(path, options = {}) {
  const { url, key, host } = supabaseConfig();
  let response;

  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "return=representation",
        ...(options.headers || {}),
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

function requestBody(request) {
  if (!request.body) {
    return {};
  }

  return typeof request.body === "string" ? JSON.parse(request.body) : request.body;
}

module.exports = {
  requestBody,
  sendJson,
  supabaseRequest,
};
