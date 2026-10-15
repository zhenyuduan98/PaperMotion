/** Prefix browser API/public-asset URLs for subpath hosting. Next Link handles page links itself. */
export function appUrl(url: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!base || !url.startsWith("/") || url.startsWith("//") || url === base || url.startsWith(base + "/")) return url;
  return base + url;
}

export function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(typeof input === "string" ? appUrl(input) : input, init);
}
