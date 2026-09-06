import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "silocamp_scan_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.SILOCAMP_SCAN_AUTH_SECRET;

  if (!secret) {
    throw new Error("SILOCAMP_SCAN_AUTH_SECRET est introuvable.");
  }

  return secret;
}

function safeEqual(a: string, b: string) {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();

  return timingSafeEqual(hashA, hashB);
}

function sign(value: string) {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createScanSession() {
  const payload = Buffer.from(
    JSON.stringify({
      sub: "silocamp-scan",
      exp: Date.now() + SESSION_DURATION,
    }),
  ).toString("base64url");

  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyScanSession(token: string | undefined) {
  if (!token) {
    return false;
  }

  try {
    const [payload, signature] = token.split(".");

    if (!payload || !signature) {
      return false;
    }

    const expectedSignature = sign(payload);

    if (!safeEqual(signature, expectedSignature)) {
      return false;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );

    if (
      !decoded ||
      decoded.sub !== "silocamp-scan" ||
      typeof decoded.exp !== "number"
    ) {
      return false;
    }

    if (decoded.exp <= Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getScanSessionFromRequest(req: {
  headers: {
    cookie?: string;
  };
}) {
  const cookies = req.headers.cookie || "";

  const match = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!match) {
    return undefined;
  }

  return decodeURIComponent(
    match.substring(`${COOKIE_NAME}=`.length),
  );
}

export function isScanAuthenticated(req: {
  headers: {
    cookie?: string;
  };
}) {
  const token = getScanSessionFromRequest(req);

  return verifyScanSession(token);
}

export function createSessionCookie(token: string) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_DURATION / 1000}`,
  ].join("; ");
}

export function createLogoutCookie() {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ].join("; ");
}

export function validateScanCredentials(
  login: string,
  password: string,
) {
  const expectedLogin = process.env.SILOCAMP_SCAN_LOGIN;
  const expectedPassword = process.env.SILOCAMP_SCAN_PASSWORD;

  if (!expectedLogin || !expectedPassword) {
    throw new Error(
      "Les identifiants SiloCamp ne sont pas configurés.",
    );
  }

  return (
    safeEqual(login, expectedLogin) &&
    safeEqual(password, expectedPassword)
  );
}