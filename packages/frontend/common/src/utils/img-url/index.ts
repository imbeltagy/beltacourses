/**
 * Joins the static-images base URL and an image path with exactly one `/` between them,
 * whichever of the two has leading/trailing slashes.
 *
 * The base comes from `NEXT_PUBLIC_STATIC_IMAGES_URL` (the files app, e.g.
 * `http://localhost:3004`) and defaults to `/`, which serves from the app's own origin.
 */
export function imgUrl(path: string): string {
  // Written out in full so Next inlines it into client bundles.
  const base = process.env.NEXT_PUBLIC_STATIC_IMAGES_URL || "/";
  return joinUrl(base, path);
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
