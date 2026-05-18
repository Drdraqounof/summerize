import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function getGoogleOAuthStateSecret() {
  const secret = process.env.GOOGLE_OAUTH_STATE_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing Google OAuth state signing secret.");
  }

  return secret;
}

function signStatePayload(payload: string) {
  return createHmac("sha256", getGoogleOAuthStateSecret()).update(payload).digest("hex");
}

export function createGoogleOAuthState() {
  const issuedAt = Date.now().toString();
  const nonce = randomBytes(16).toString("hex");
  const payload = `${issuedAt}.${nonce}`;
  const signature = signStatePayload(payload);

  return `${payload}.${signature}`;
}

export function verifyGoogleOAuthState(state: string) {
  const [issuedAt, nonce, signature] = state.split(".");

  if (!issuedAt || !nonce || !signature) {
    return false;
  }

  const issuedAtMs = Number.parseInt(issuedAt, 10);

  if (!Number.isFinite(issuedAtMs)) {
    return false;
  }

  const ageMs = Date.now() - issuedAtMs;

  if (ageMs < 0 || ageMs > STATE_MAX_AGE_MS) {
    return false;
  }

  const expectedSignature = signStatePayload(`${issuedAt}.${nonce}`);
  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}