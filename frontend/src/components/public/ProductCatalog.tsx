import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ContentCard, State } from '../common/Shared';
import type { Content, PageResult } from '../../types';
const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
export default function ProductCatalog() {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(0);
  const categories = useQuery({
    queryKey: ['product-categories', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/product-categories', {
          params: { locale: i18n.language, size: 50 },
        })
      ).data,
  });
  const catalog = useQuery({
    queryKey: ['product-catalog', i18n.language, page, group],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/products', {
          params: { locale: i18n.language, size: 50, page, category: group || undefined },
        })
      ).data,
  });
  const items = catalog.data?.items || [];
  const filtered = items.filter((item) =>
    normalize(`${item.title} ${item.excerpt}`).includes(normalize(search.trim())),
  );
  if (sort !== 'featured')
    filtered.sort(
      (a, b) => (sort === 'az' ? 1 : -1) * a.title.localeCompare(b.title, i18n.language),
    );
  const reset = () => {
    setSearch('');
    setGroup('');
    setSort('featured');
  };
  return (
    <section className="catalog" aria-label={vi ? 'Danh mục sản phẩm' : 'Product catalog'}>
      <div className="catalog-filter">
        <label className="catalog-search" htmlFor="product-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">{vi ? 'Tìm kiếm sản phẩm' : 'Search products'}</span>
          <input
            id="product-search"
            type="search"
            maxLength={200}
            placeholder={vi ? 'Tìm tên sản phẩm, chất liệu…' : 'Search products, materials…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="catalog-select">
          <span>
            <SlidersHorizontal size={14} />
            {vi ? 'Nhóm sản phẩm' : 'Product group'}
          </span>
          <select
            aria-label={vi ? 'Nhóm sản phẩm' : 'Product group'}
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setPage(0);
            }}
          >
            <option value="">{vi ? 'Tất cả nhóm' : 'All groups'}</option>
            {categories.data?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="catalog-select">
          <span>{vi ? 'Sắp xếp' : 'Sort by'}</span>
          <select
            aria-label={vi ? 'Sắp xếp' : 'Sort by'}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">{vi ? 'Theo giới thiệu' : 'Featured order'}</option>
            <option value="az">{vi ? 'Tên: A → Z' : 'Name: A → Z'}</option>
            <option value="za">{vi ? 'Tên: Z → A' : 'Name: Z → A'}</option>
          </select>
        </label>
      </div>
      <div className="catalog-summary">
        <h2>{vi ? 'Khám phá nhóm sản phẩm' : 'Explore product groups'}</h2>
        <p role="status">
          {vi ? `${filtered.length} nhóm sản phẩm` : `${filtered.length} product groups`}
        </p>
        {(search || group || sort !== 'featured') && (
          <button onClick={reset}>
            <X size={14} />
            {vi ? 'Xóa bộ lọc' : 'Clear filters'}
          </button>
        )}
      </div>
      {catalog.isPending || catalog.isError ? (
        <State
          loading={catalog.isPending}
          error={catalog.isError}
          retry={() => void catalog.refetch()}
        />
      ) : filtered.length ? (
        <div className="article-grid catalog-grid">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} base="/san-pham" />
          ))}
        </div>
      ) : (
        <div className="public-empty">
          <h2>{vi ? 'Chưa tìm thấy sản phẩm phù hợp' : 'No matching products'}</h2>
          <p>
            {vi
              ? 'Thử từ khóa khác hoặc xem lại toàn bộ nhóm sản phẩm.'
              : 'Try another keyword or explore all product groups.'}
          </p>
          <button className="button" onClick={reset}>
            {vi ? 'Xem tất cả sản phẩm' : 'View all products'}
          </button>
        </div>
      )}
      {!!catalog.data && catalog.data.total > 50 && (
        <div className="pagination">
          <button
            disabled={!page}
            onClick={() => {
              setPage(page - 1);
              reset();
            }}
          >
            {vi ? 'Trước' : 'Previous'}
          </button>
          <span>
            {page + 1} / {Math.ceil(catalog.data.total / 50)}
          </span>
          <button
            disabled={(page + 1) * 50 >= catalog.data.total}
            onClick={() => {
              setPage(page + 1);
              reset();
            }}
          >
            {vi ? 'Tiếp' : 'Next'}
          </button>
        </div>
      )}
      <div className="catalog-enquiry">
        <div>
          <span className="eyebrow">HUGAMEX / PRODUCT</span>
          <h2>{vi ? 'Bạn đang tìm nhóm sản phẩm nào?' : 'What are you looking to make?'}</h2>
          <p>
            {vi
              ? 'Chia sẻ thiết kế và yêu cầu để cùng trao đổi về hướng sản xuất phù hợp.'
              : 'Share your designs and requirements to discuss a suitable manufacturing approach.'}
          </p>
        </div>
        <Link className="button" to="/lien-he">
          {vi ? 'Trao đổi với HUGAMEX' : 'Talk to HUGAMEX'}
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  );
}
