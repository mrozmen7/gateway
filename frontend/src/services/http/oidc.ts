import type { Session } from '@entities/identity/model';
import { env } from '@shared/config/env';
import { authTokenStore } from './_auth';

const OIDC_STATE_KEY = 'helvetiq.oidc-state';
const OIDC_VERIFIER_KEY = 'helvetiq.oidc-code-verifier';

export const beginOidcLogin = async (): Promise<void> => {
  const state = randomUrlSafe(24);
  const verifier = randomUrlSafe(64);
  const challenge = await sha256Base64Url(verifier);

  sessionStorage.setItem(OIDC_STATE_KEY, state);
  sessionStorage.setItem(OIDC_VERIFIER_KEY, verifier);

  const authorizeUrl = new URL(`${env.oidcIssuerUrl}/protocol/openid-connect/auth`);
  authorizeUrl.searchParams.set('client_id', env.oidcClientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri());
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  // Demo-friendly: after signing out, force Keycloak to ask for credentials again.
  authorizeUrl.searchParams.set('prompt', 'login');

  window.location.assign(authorizeUrl.toString());
};

export const completeOidcLogin = async (code: string, state: string): Promise<Session> => {
  const expectedState = sessionStorage.getItem(OIDC_STATE_KEY);
  const verifier = sessionStorage.getItem(OIDC_VERIFIER_KEY);

  if (!expectedState || !verifier || expectedState !== state) {
    throw new Error('OIDC state validation failed.');
  }

  const response = await fetch(`${env.oidcIssuerUrl}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.oidcClientId,
      redirect_uri: redirectUri(),
      code,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error('OIDC token exchange failed.');
  }

  const tokenSet = (await response.json()) as { access_token: string };
  authTokenStore.set(tokenSet.access_token);
  sessionStorage.removeItem(OIDC_STATE_KEY);
  sessionStorage.removeItem(OIDC_VERIFIER_KEY);

  return sessionFromAccessToken(tokenSet.access_token);
};

export const sessionFromAccessToken = (token: string): Session => {
  const claims = decodeJwtPayload(token);
  const roles = realmRoles(claims);
  const persona = roles.includes('OPS') || roles.includes('OPERATOR') ? 'operator' : 'client';
  const username = stringClaim(claims, 'preferred_username', stringClaim(claims, 'sub', 'user'));
  const userId = stringClaim(claims, 'bank_user_id', stringClaim(claims, 'sub', username));
  const email = stringClaim(claims, 'email', username);
  const displayName = stringClaim(claims, 'name', prettyName(username));
  const expiresAt = typeof claims.exp === 'number'
    ? new Date(claims.exp * 1000).toISOString()
    : new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return {
    userId,
    customerId: persona === 'client' ? userId : null,
    displayName,
    email,
    persona,
    locale: 'en',
    createdAt: new Date().toISOString(),
    expiresAt,
    deviceName: 'OIDC browser session',
  };
};

const redirectUri = (): string => `${window.location.origin}/auth/callback`;

const randomUrlSafe = (size: number): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return base64Url(bytes);
};

const sha256Base64Url = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
};

const base64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('OIDC access token is malformed.');
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return JSON.parse(atob(padded)) as Record<string, unknown>;
};

const realmRoles = (claims: Record<string, unknown>): string[] => {
  const realmAccess = claims.realm_access;
  if (!realmAccess || typeof realmAccess !== 'object') return [];
  const roles = (realmAccess as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];
  return roles.map(String).map((role) => role.toUpperCase());
};

const stringClaim = (claims: Record<string, unknown>, claim: string, fallback: string): string => {
  const value = claims[claim];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
};

const prettyName = (username: string): string =>
  username
    .split(/[.@_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
