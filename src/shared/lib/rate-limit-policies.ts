import type { RateLimit } from '@/shared/db';

export const LOGIN_ACCOUNT_MAX = 5;
export const LOGIN_IP_MAX = 30;
export const LOGIN_WINDOW_MINUTES = 15;
export const SIGNUP_IP_MAX = 5;
export const SIGNUP_WINDOW_MINUTES = 60;

/** Keyed by email and IP, so failures from one client cannot lock the owner out. */
export function loginAccountLimit(email: string, ip: string): RateLimit {
  return {
    key: `login:account:${email}:${ip}`,
    max: LOGIN_ACCOUNT_MAX,
    windowMinutes: LOGIN_WINDOW_MINUTES,
  };
}

export function loginIpLimit(ip: string): RateLimit {
  return {
    key: `login:ip:${ip}`,
    max: LOGIN_IP_MAX,
    windowMinutes: LOGIN_WINDOW_MINUTES,
  };
}

export function signUpIpLimit(ip: string): RateLimit {
  return {
    key: `signup:ip:${ip}`,
    max: SIGNUP_IP_MAX,
    windowMinutes: SIGNUP_WINDOW_MINUTES,
  };
}
