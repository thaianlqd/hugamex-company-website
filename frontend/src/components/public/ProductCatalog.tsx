import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, ArrowUpRight } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import CategoryShowcase, { useProductCategories } from './CategoryShowcase';
import { api } from '../../services/api';
import { ContentCard, State } from '../common/Shared';
import type { Content, PageResult } from '../../types';
export default function ProductCatalog() {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== '#catalog-results') return;
    const frame = window.requestAnimationFrame(() =>
      document.getElementById('catalog-results')?.scrollIntoView(),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [hash, params]);
  const group = params.get('category') || '';
  const setGroup = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('category', value);
    else next.delete('category');
    setParams(next, { replace: true });
  };
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [search]);
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(0);
  const categories = useProductCategories();
  const catalog = useQuery({
    queryKey: ['product-catalog', i18n.language, page, group, term, sort],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/products', {
          params: {
            locale: i18n.language,
            size: 24,
            page,
            category: group || undefined,
            search: term,
            sort,
          },
        })
      ).data,
  });
  const items = catalog.data?.items || [];
  const filtered = items;
  const activeCategories = (categories.data?.items || []).filter(
    (category) => !group || category.id === group,
  );
  const reset = () => {
    setSearch('');
    setGroup('');
    setSort('featured');
    setPage(0);
  };
  return (
    <section className="catalog" aria-label={vi ? 'Danh mục sản phẩm' : 'Product catalog'}>
      <div className="category-intro">
        <div className="eyebrow">HUGAMEX / PRODUCT FAMILIES</div>
        <h2>
          {vi ? 'Chọn danh mục. Khám phá sản phẩm.' : 'Choose a category. Explore the garments.'}
        </h2>
        <p>
          {vi
            ? 'Danh mục giới thiệu chuyên môn sản xuất may mặc, để bắt đầu một cuộc trao đổi phù hợp.'
            : 'A showcase of garment manufacturing expertise, to begin a focused conversation.'}
        </p>
      </div>
      <CategoryShowcase compact limit={4} />
      <div className="catalog-filter" id="catalog-results">
        <label className="catalog-search" htmlFor="product-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">{vi ? 'Tìm kiếm sản phẩm' : 'Search products'}</span>
          <input
            id="product-search"
            type="search"
            maxLength={200}
            placeholder={vi ? 'Tìm tên sản phẩm, chất liệu…' : 'Search products, materials…'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
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
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
          >
            <option value="featured">{vi ? 'Theo giới thiệu' : 'Featured order'}</option>
            <option value="az">{vi ? 'Tên: A → Z' : 'Name: A → Z'}</option>
            <option value="za">{vi ? 'Tên: Z → A' : 'Name: Z → A'}</option>
          </select>
        </label>
      </div>
      <div className="catalog-summary">
        <h2>{vi ? 'Sản phẩm theo danh mục' : 'Products by category'}</h2>
        <p role="status">
          {vi ? `${catalog.data?.total || 0} sản phẩm` : `${catalog.data?.total || 0} products`}
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
        <div className="catalog-groups">
          {activeCategories.map((category) => {
            const products = filtered.filter((item) => item.categoryIds.includes(category.id));
            if (!products.length) return null;
            return (
              <section key={category.id} className="catalog-category">
                <div className="catalog-category-heading">
                  <div>
                    <span className="eyebrow">{vi ? 'DANH MỤC' : 'CATEGORY'}</span>
                    <h2>{category.title}</h2>
                    <p>{category.excerpt}</p>
                  </div>
                  <span>
                    {products.length} {vi ? 'sản phẩm trên trang' : 'products on this page'}
                  </span>
                </div>
                <div className="article-grid catalog-grid">
                  {products.map((item) => (
                    <ContentCard key={item.id} item={item} base="/san-pham" />
                  ))}
                </div>
              </section>
            );
          })}
          {categories.isPending || categories.isError ? (
            <State
              loading={categories.isPending}
              error={categories.isError}
              retry={() => void categories.refetch()}
            />
          ) : null}
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
      {!!catalog.data && catalog.data.total > 24 && (
        <div className="pagination">
          <button
            disabled={!page}
            onClick={() => {
              setPage(page - 1);
            }}
          >
            {vi ? 'Trước' : 'Previous'}
          </button>
          <span>
            {page + 1} / {Math.ceil(catalog.data.total / 24)}
          </span>
          <button
            disabled={(page + 1) * 24 >= catalog.data.total}
            onClick={() => {
              setPage(page + 1);
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
