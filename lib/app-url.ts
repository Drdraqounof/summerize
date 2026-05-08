const LOCAL_DEV_URL = "http://localhost:3001";

export function getAppUrl(requestUrl?: string) {
  const configuredUrl = process.env.APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
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