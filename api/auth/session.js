const { decodeSession, parseCookies, publicUser, sessionCookie } = require("./_shared");

module.exports = async function handler(request, response) {
  const session = decodeSession(parseCookies(request)[sessionCookie]);
  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    authenticated: Boolean(session),
    user: publicUser(session),
  });
};
