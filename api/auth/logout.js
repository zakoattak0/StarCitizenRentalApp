const { clearCookieHeader, sessionCookie } = require("./_shared");

module.exports = async function handler(request, response) {
  response.setHeader("Set-Cookie", clearCookieHeader(sessionCookie));
  response.writeHead(302, { Location: "/" });
  response.end();
};
