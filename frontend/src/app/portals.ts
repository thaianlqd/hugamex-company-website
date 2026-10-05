export type Surface = 'public' | 'admin';
export const appSurface: Surface =
  import.meta.env.VITE_APP_SURFACE === 'admin' ? 'admin' : 'public';

export function portalUrl(surface: Surface, path = '/') {
  const configured =
    surface === 'admin' ? import.meta.env.VITE_ADMIN_URL : import.meta.env.VITE_PUBLIC_URL;
  const origin = configured || (import.meta.env.DEV ? window.location.origin : undefined);
  if (!origin) return undefined;
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Portal URL must be an HTTP(S) origin without credentials.');
  if (!configured) url.port = surface === 'admin' ? '5180' : '5173';
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Expected a local route.');
  return new URL(path, url.origin).href;
}
