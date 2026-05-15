const LOCAL_DEV_URL = "http://localhost:3001";

function normalizeConfiguredAppUrl(configuredUrl: string) {
  const trimmedUrl = configuredUrl.trim().replace(/\/$/, "");

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }

  const isLocalHost =
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1" ||
    parsedUrl.hostname === "::1";

  if (process.env.NODE_ENV === "production" && parsedUrl.protocol === "http:" && !isLocalHost) {
    parsedUrl.protocol = "https:";
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

export function getAppUrl(requestUrl?: string) {
  const configuredUrl = process.env.APP_URL?.trim();

  if (configuredUrl) {
    return normalizeConfiguredAppUrl(configuredUrl);
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_DEV_URL;
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  throw new Error("APP_URL is not configured.");
}

export function getGoogleCallbackUrl(requestUrl?: string) {
  return `${getAppUrl(requestUrl)}/api/google/callback`;
}