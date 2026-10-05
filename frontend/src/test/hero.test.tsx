import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeHero from '../components/public/HomeHero';
import { validHeroImageUrl } from '../components/common/ContentImage';
import type { Content } from '../types';
import '../i18n';
const slides = [1, 2, 3].map((n) => ({
  id: `hero-${n}`,
  kind: 'HERO',
  status: 'PUBLISHED',
  featured: true,
  featuredMediaId: null,
  publishedAt: null,
  locale: 'vi',
  slug: `hero-${n}`,
  content: { type: 'doc' },
  seoTitle: 'Hero',
  seoDescription: 'Intro',
  categoryIds: [],
  title: `Slide ${n}`,
  excerpt: 'Editorial intro',
  metadata: {
    link: '/gioi-thieu',
    externalImageUrl: `https://images.pexels.com/photos/${n}/image.jpeg`,
  },
})) as Content[];
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function show() {
  render(
    <MemoryRouter>
      <HomeHero slides={slides} />
    </MemoryRouter>,
  );
}
describe('Hero carousel', () => {
  it('advances after six seconds, pauses during hover and restarts after a manual selection', async () => {
    vi.useFakeTimers();
    show();
    const controls = screen.getAllByRole('button', { name: /Xem ảnh|Show slide/ });
    expect(controls[0]).toHaveAttribute('aria-pressed', 'true');
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(controls[1]).toHaveAttribute('aria-pressed', 'true');
    fireEvent.mouseEnter(screen.getByRole('region'));
    await act(async () => {
      vi.advanceTimersByTime(12000);
    });
    expect(controls[1]).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(controls[2]);
    fireEvent.mouseLeave(screen.getByRole('region'));
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(controls[0]).toHaveAttribute('aria-pressed', 'true');
  });
  it('pauses while focus is inside the carousel', async () => {
    vi.useFakeTimers();
    show();
    const controls = screen.getAllByRole('button', { name: /Xem ảnh|Show slide/ });
    fireEvent.focus(controls[0]);
    await act(async () => {
      vi.advanceTimersByTime(12000);
    });
    expect(controls[0]).toHaveAttribute('aria-pressed', 'true');
  });
  it('validates exact HTTPS image hosts and rejects credentials and alternate ports', () => {
    expect(validHeroImageUrl('https://images.pexels.com/a.jpeg')).toBe(true);
    expect(validHeroImageUrl('https://images.unsplash.com/a?width=1200')).toBe(true);
    for (const url of [
      'http://images.pexels.com/a',
      'https://images.pexels.com.evil/a',
      'https://user@images.pexels.com/a',
      'https://images.pexels.com:8080/a',
      'javascript:alert(1)',
    ])
      expect(validHeroImageUrl(url)).toBe(false);
  });
});
