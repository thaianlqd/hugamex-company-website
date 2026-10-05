import { beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductCatalog from '../components/public/ProductCatalog';
import CustomerReferences from '../components/public/CustomerReferences';
import { api } from '../services/api';
import i18n from '../i18n';
vi.mock('../services/api', () => ({ api: { get: vi.fn(), defaults: { baseURL: '/api/v1' } } }));
const category = {
  id: 'cat-a',
  title: 'Áo khoác',
  excerpt: 'Nhóm áo khoác',
  metadata: {},
  content: { type: 'doc' },
  categoryIds: [],
  featuredMediaId: null,
};
const product = {
  ...category,
  id: 'product-a',
  title: 'Áo khoác mẫu',
  slug: 'ao-khoac-mau',
  locale: 'vi',
  categoryIds: ['cat-a'],
};
function show(component: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/san-pham?category=cat-a']}>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(async () => {
  cleanup();
  vi.clearAllMocks();
  await i18n.changeLanguage('vi');
});
it('keeps category and sort when changing result pages and searches on the server', async () => {
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data:
      url === '/public/product-categories'
        ? { items: [category], total: 1 }
        : { items: [product], total: 30, size: 24, page: 0 },
  }));
  show(<ProductCatalog />);
  await screen.findByText('Áo khoác mẫu');
  expect(screen.getByRole('combobox', { name: 'Nhóm sản phẩm' })).toHaveValue('cat-a');
  fireEvent.change(screen.getByRole('combobox', { name: 'Sắp xếp' }), { target: { value: 'az' } });
  fireEvent.click(await screen.findByRole('button', { name: /^Tiếp$/ }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith('/public/products', {
      params: expect.objectContaining({ category: 'cat-a', sort: 'az', page: 1, size: 24 }),
    }),
  );
  fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm kiếm sản phẩm' }), {
    target: { value: 'ao khoac' },
  });
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith('/public/products', {
      params: expect.objectContaining({ category: 'cat-a', search: 'ao khoac', page: 0 }),
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Nhóm sản phẩm' })).toHaveValue(''),
  );
});
it('shows the dated customer names and composition as readable values', async () => {
  const customer = {
    ...category,
    id: 'ref-a',
    slug: 'ho-so',
    title: 'Khách hàng 2022',
    metadata: {
      referenceYear: '2022',
      customerNames: 'Columbia|Toray Group|L.L.Bean',
      composition: 'Columbia:40|Sumitex:36|Other:24',
    },
  };
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: url === '/public/partners' ? { items: [customer] } : customer,
  }));
  show(<CustomerReferences />);
  await screen.findByText('Toray Group');
  expect(screen.getByText('40%')).toBeVisible();
  expect(screen.getByText('36%')).toBeVisible();
  expect(screen.getByText('24%')).toBeVisible();
  expect(screen.getByText(/không xác nhận hợp đồng/)).toBeVisible();
});
