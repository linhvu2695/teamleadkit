export const LINK_AUTH_TOKEN_KEY = "teamleadkit:link-auth-token";
const LINK_AUTH_TOKEN_HEADER = "X-Link-Auth-Token";

export function getStoredLinkAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LINK_AUTH_TOKEN_KEY);
}

export function setStoredLinkAuthToken(token: string): void {
    localStorage.setItem(LINK_AUTH_TOKEN_KEY, token);
}

export function clearStoredLinkAuthToken(): void {
    localStorage.removeItem(LINK_AUTH_TOKEN_KEY);
}

/**
 * Fetch wrapper that adds the stored Link auth token to the request header.
 * Use for all work API calls that require the token.
 */
export async function fetchWithLinkAuth(
    url: string | URL,
    init?: RequestInit
): Promise<Response> {
    const token = getStoredLinkAuthToken();
    const headers = new Headers(init?.headers);
    if (token) {
        headers.set(LINK_AUTH_TOKEN_HEADER, token);
    }
    return fetch(url, { ...init, headers });
}
