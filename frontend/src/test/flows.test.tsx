import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import type { ReactNode } from 'react';
import PublicLayout from '../app/layouts/PublicLayout';
import PublicContent from '../pages/PublicContent';
import AuthPage from '../features/auth/AuthPage';
import AdminLayout from '../features/admin/AdminLayout';
import ContactPage from '../features/contact/ContactPage';
import { RichText, Seo } from '../components/common/Shared';
import { api } from '../services/api';
import i18n from '../i18n';
import type { User } from '../types';
const auth = vi.hoisted(() => ({
  user: null as User | null,
  pending: false,
  login: vi.fn(),
  logout: vi.fn(),
  sync: vi.fn(),
  resetToken: '',
  setResetToken: vi.fn(),
}));
vi.mock('../features/auth/AuthProvider', () => ({ useAuth: () => auth }));
vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), defaults: { baseURL: '/api/v1' } },
  csrf: vi.fn(async () => ({ 'X-CSRF-TOKEN': 'test-only' })),
  errorMessage: () => 'API unavailable',
}));
function wrap(children: ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}
beforeEach(async () => {
  cleanup();
  vi.clearAllMocks();
  auth.user = null;
  auth.resetToken = '';
  await i18n.changeLanguage('vi');
  vi.mocked(api.get).mockResolvedValue({
    data: { items: [], total: 0, page: 0, size: 12, sections: [], settings: {} },
  });
});
describe('Public journeys', () => {
  it('switches navigation labels to English', async () => {
    wrap(<PublicLayout />);
    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    await screen.findAllByText('About us');
    expect(screen.getAllByText('Our network').length).toBeGreaterThan(0);
  });
  it('opens and closes the mobile menu', () => {
    wrap(<PublicLayout />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    expect(document.querySelector('dialog')?.open).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(document.querySelector('dialog')?.open).toBe(false);
  });
  it('renders published news and a detail link', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [
          {
            id: 'a',
            title: 'Bài viết kiểm thử',
            slug: 'bai-viet',
            excerpt: 'Nội dung thử',
            locale: 'vi',
            featuredMediaId: null,
            publishedAt: null,
          },
        ],
        total: 1,
        page: 0,
        size: 12,
      },
    });
    wrap(<PublicContent />, '/tin-tuc');
    expect(await screen.findByRole('heading', { name: 'Bài viết kiểm thử' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bài viết kiểm thử/ })).toHaveAttribute(
      'href',
      '/tin-tuc/bai-viet',
    );
  });
  it('shows API failure and can retry', async () => {
    let productRequests = 0;
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === '/public/products' && ++productRequests === 1) throw new Error('offline');
      return { data: { items: [], total: 0, page: 0, size: 50, sections: [], settings: {} } };
    });
    wrap(<PublicContent />, '/san-pham');
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(productRequests).toBe(2));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
  it('renders structured article text and escapes markup', () => {
    wrap(
      <RichText
        node={{
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '<script>alert(1)</script>' }] },
          ],
        }}
      />,
    );
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
  it('rejects invalid contact data without calling the API', async () => {
    wrap(<ContactPage />, '/lien-he');
    fireEvent.click(screen.getByRole('button', { name: 'Gửi thông tin' }));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
    expect(api.post).not.toHaveBeenCalled();
  });
  it('shows successful contact submission', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    wrap(<ContactPage />, '/lien-he');
    fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Test Person' } });
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'test@example.invalid' },
    });
    fireEvent.change(screen.getByLabelText('Chủ đề *'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Nội dung *'), { target: { value: 'Test enquiry' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi thông tin' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Thông tin đã được gửi.');
  });
});
describe('Authentication and admin', () => {
  it('rejects weak registration passwords', async () => {
    wrap(<AuthPage />, '/dang-ky');
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.invalid' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('12 ký tự');
    expect(api.post).not.toHaveBeenCalled();
  });
  it('reports failed login without exposing technical errors', async () => {
    auth.login.mockRejectedValueOnce(new Error('fail'));
    wrap(<AuthPage />, '/dang-nhap');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.invalid' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'password phrase' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('API unavailable');
  });
  it('redirects an anonymous admin visitor to sign in', async () => {
    wrap(
      <Routes>
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="/dang-nhap" element={<p>Sign in destination</p>} />
      </Routes>,
      '/admin',
    );
    expect(await screen.findByText('Sign in destination')).toBeInTheDocument();
  });
  it('requires MFA after an EDITOR has opted into it', () => {
    auth.user = {
      id: 'x',
      name: 'Test',
      email: 'test@example.invalid',
      roles: ['EDITOR'],
      verified: true,
      mfaEnabled: true,
      mfaVerified: false,
    };
    wrap(<AdminLayout />, '/admin');
    expect(screen.getByRole('heading', { name: 'Xác thực hai bước' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Admin' })).toBeNull();
  });
  it('renders a single text title with the React 19 metadata dispatcher', async () => {
    wrap(<Seo title="Tiêu đề thử nghiệm" path="/" />);
    await waitFor(() => expect(document.title).toBe('Tiêu đề thử nghiệm | HUGAMEX'));
  });
  it('requires MFA for ADMIN even with an EDITOR role', () => {
    auth.user = {
      id: 'x',
      name: 'Test',
      email: 'test@example.invalid',
      roles: ['ADMIN', 'EDITOR'],
      verified: true,
      mfaEnabled: false,
      mfaVerified: false,
    };
    wrap(<AdminLayout />, '/admin');
    expect(screen.getByRole('heading', { name: 'Xác thực hai bước' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Admin' })).toBeNull();
  });
});
