const crypto = require("node:crypto");

const sessionCookie = "fsx_session";
const stateCookie = "fsx_oauth_state";
const sessionMaxAge = 60 * 60 * 24 * 7;

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function getBaseUrl(request) {
  const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const host = request.headers["x-forwarded-host"] || request.headers.host;
  const protocol = request.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}`;
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required");
  }

  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeSession(session) {
  const payload = base64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

function decodeSession(cookieValue) {
  if (!cookieValue) {
    return null;
  }

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature || sign(payload) !== signature) {
    return null;
  }

  const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!session.expiresAt || Date.now() > Date.parse(session.expiresAt)) {
    return null;
  }

  return session;
}

function parseCookies(request) {
  return String(request.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const [name, ...valueParts] = part.split("=");
      cookies[name] = decodeURIComponent(valueParts.join("="));
      return cookies;
    }, {});
}

function cookieHeader(name, value, maxAge = sessionMaxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearCookieHeader(name) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function publicUser(session) {
  if (!session?.user) {
    return null;
  }

  const profile = {
    rsiHandle: "",
    rsiStatus: "not_linked",
    rsiVerificationCode: "",
    publicName: session.user.displayName || session.user.username,
    ...(session.user.profile || {}),
  };

  return {
    id: session.user.id,
    discordId: session.user.discordId,
    username: session.user.username,
    displayName: session.user.displayName || session.user.username,
    avatarUrl: session.user.avatarUrl,
    createdAt: session.user.createdAt,
    profile,
    stats: session.user.stats || {
      rating: 0,
      completedContracts: 0,
      activeListings: 0,
      orgAffiliation: "None",
    },
  };
}

module.exports = {
  clearCookieHeader,
  cookieHeader,
  decodeSession,
  encodeSession,
  getBaseUrl,
  parseCookies,
  publicUser,
  sessionCookie,
  stateCookie,
};
