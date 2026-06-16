function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }

  return {
    key,
    url: url.replace(/\/$/, ""),
  };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.hint || `Supabase returned ${response.status}`;
    throw new Error(message);
  }

  return payload;
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
