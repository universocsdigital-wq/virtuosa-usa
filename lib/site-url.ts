export const SITE_URL = "https://virtuosausa.com" as const;

export const SQUARE_WEBHOOK_URL = `${SITE_URL}/api/webhooks/square` as const;

export function getSiteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
