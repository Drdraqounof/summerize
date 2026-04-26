/**
 * In-memory token store for Google OAuth access tokens
 * Note: This is temporary. In production, use a database or secure session storage.
 */

interface TokenData {
  accessToken: string;
  storedAt: number;
}

const tokens = new Map<string, TokenData>();

export function storeToken(email: string, accessToken: string): void {
  tokens.set(email, {
    accessToken,
    storedAt: Date.now(),
  });
}

export function getToken(email: string): string | null {
  const data = tokens.get(email);
  if (!data) return null;
  
  // Tokens are valid for ~1 hour. For now, assume they're still valid.
  // In production, check expiration and refresh if needed.
  return data.accessToken;
}

export function clearToken(email: string): void {
  tokens.delete(email);
}
