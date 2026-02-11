const ACCESS_TOKEN_KEY = 'voicenexus_access_token';
const USER_ROLE_KEY = 'voicenexus_user_role';

export function getAccessToken(): string {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
}

export function getUserRole(): string {
  return window.localStorage.getItem(USER_ROLE_KEY) ?? '';
}

export function setAuthSession(accessToken: string, role: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_ROLE_KEY, role);
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_ROLE_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken().length > 0;
}
