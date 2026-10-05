import type { ImgHTMLAttributes } from 'react';
export const HERO_IMAGE_HOSTS = new Set(['images.pexels.com', 'images.unsplash.com']);
export function validHeroImageUrl(value: string): boolean {
  if (!value || value.length > 1000) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      HERO_IMAGE_HOSTS.has(u.hostname) &&
      !u.username &&
      !u.password &&
      (!u.port || u.port === '443')
    );
  } catch {
    return false;
  }
}
export default function ContentImage({
  fallback = '/assets/garment-study.svg',
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { fallback?: string }) {
  return (
    <img
      crossOrigin={props.src?.startsWith('https://images.') ? 'anonymous' : undefined}
      referrerPolicy="no-referrer"
      decoding="async"
      loading="lazy"
      {...props}
      onError={(e) => {
        if (e.currentTarget.dataset.fallback) return;
        e.currentTarget.dataset.fallback = 'true';
        e.currentTarget.src = fallback;
      }}
    />
  );
}
