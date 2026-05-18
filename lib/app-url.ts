const LOCAL_DEV_URL = "http://localhost:3001";

type HeaderSource = {
  get(name: string): string | null | undefined;
};

type AppUrlRequestLike = {
  url?: string;
  headers?: HeaderSource;
};

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

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getFirstHeaderValue(headers: HeaderSource | undefined, name: string) {
  const value = headers?.get(name)?.trim();

  if (!value) {
    return undefined;
  }

  return value.split(",")[0]?.trim() || undefined;
}

function tryGetForwardedOrigin(request: AppUrlRequestLike | undefined) {
  const forwardedHost = getFirstHeaderValue(request?.headers, "x-forwarded-host");
  const forwardedProto = getFirstHeaderValue(request?.headers, "x-forwarded-proto");
  const host = forwardedHost || getFirstHeaderValue(request?.headers, "host");

  if (!host) {
    return undefined;
  }

  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return normalizeConfiguredAppUrl(`${protocol}://${host}`);
}

function tryGetRequestOrigin(request: AppUrlRequestLike | undefined) {
  if (!request?.url) {
    return undefined;
  }

  try {
    return normalizeConfiguredAppUrl(new URL(request.url).origin);
  } catch {
    return undefined;
  }
}

export function getAppUrl(request?: AppUrlRequestLike) {
  const configuredUrl = process.env.APP_URL?.trim();

  if (configuredUrl) {
    return normalizeConfiguredAppUrl(configuredUrl);
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_DEV_URL;
  }

  const forwardedOrigin = tryGetForwardedOrigin(request);

  if (forwardedOrigin) {
    const hostname = new URL(forwardedOrigin).hostname;

    if (!isLocalHost(hostname)) {
      return forwardedOrigin;
    }
  }

  const requestOrigin = tryGetRequestOrigin(request);

  if (requestOrigin) {
    const hostname = new URL(requestOrigin).hostname;

    if (!isLocalHost(hostname)) {
      return requestOrigin;
    }
  }

  throw new Error("APP_URL is not configured and no public app origin could be determined.");
}

export function getGoogleCallbackUrl(request?: AppUrlRequestLike) {
  return `${getAppUrl(request)}/api/google/callback`;
}