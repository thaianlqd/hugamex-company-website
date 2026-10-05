import { afterEach, describe, expect, it, vi } from 'vitest';
import { portalUrl } from '../app/portals';

afterEach(() => vi.unstubAllEnvs());
describe('Separate public and admin origins', () => {
  it('routes to the appropriate local port and preserves nested routes', () => {
    vi.stubEnv('VITE_ADMIN_URL', '');
    vi.stubEnv('VITE_PUBLIC_URL', '');
    const admin = new URL(portalUrl('admin', '/admin/posts?locale=en')!);
    const customer = new URL(portalUrl('public')!);
    expect(admin.port).toBe('5180');
    expect(admin.pathname + admin.search).toBe('/admin/posts?locale=en');
    expect(customer.port).toBe('5173');
    expect(admin.origin).not.toBe(customer.origin);
  });
  it('uses configured origins without allowing credential or script URLs', () => {
    vi.stubEnv('VITE_ADMIN_URL', 'https://cms.example.invalid');
    expect(portalUrl('admin', '/admin')).toBe('https://cms.example.invalid/admin');
    vi.stubEnv('VITE_ADMIN_URL', 'javascript:alert(1)');
    expect(() => portalUrl('admin')).toThrow();
    vi.stubEnv('VITE_ADMIN_URL', 'https://user:pass@example.invalid');
    expect(() => portalUrl('admin')).toThrow();
  });
  it('rejects a cross-origin route target', () => {
    vi.stubEnv('VITE_ADMIN_URL', 'https://cms.example.invalid');
    expect(() => portalUrl('admin', '//other.example.invalid')).toThrow();
  });
});
