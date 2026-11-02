import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "puppy-local-dev-secret-only-do-not-deploy";
const SESSION_SECONDS = Object.freeze({ participant: 40 * 24 * 60 * 60, admin: 12 * 60 * 60 });

function signingSecret() {
  return process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : DEV_SECRET);
}

export function issueSession(role, subject) {
  const secret = signingSecret();
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: String(subject), role, iat: now, exp: now + SESSION_SECONDS[role] })).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifySession(token) {
  const secret = signingSecret();
  if (!secret || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", secret).update(unsigned).digest();
  let actual;
  try { actual = Buffer.from(parts[2], "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.sub || !["participant", "admin"].includes(payload.role) || !Number.isInteger(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

export function bearerSession(request) {
  const header = request.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? verifySession(match[1]) : null;
}

export function requireAdmin(request, response, next) {
  const session = bearerSession(request);
  if (session?.role !== "admin" || session.sub !== "researcher") return response.status(401).json({ error: "Researcher login is required." });
  request.auth = session;
  next();
}

export function requireParticipant(request, response, participantId) {
  const session = bearerSession(request);
  if (session?.role !== "participant") {
    response.status(401).json({ error: "Participant login is required. Restore your participant with its recovery code." });
    return false;
  }
  if (session.sub !== String(participantId)) {
    response.status(403).json({ error: "This participant session cannot access that record." });
    return false;
  }
  request.auth = session;
  return true;
}
