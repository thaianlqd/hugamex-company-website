import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { api } from '../../services/api';
import ContentImage from '../common/ContentImage';
import { State } from '../common/Shared';
import type { Content, PageResult } from '../../types';
export function useProductCategories(enabled = true) {
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['product-categories', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/product-categories', {
          params: { locale: i18n.language, size: 50 },
        })
      ).data,
    enabled,
  });
}
export default function CategoryShowcase({
  compact = false,
  limit,
}: {
  compact?: boolean;
  limit?: number;
}) {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const categories = useProductCategories();
  const display = [...(categories.data?.items || [])].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );
  return (
    <div className={`category-showcase${compact ? ' category-showcase-compact' : ''}`}>
      {categories.isPending || categories.isError ? (
        <State
          loading={categories.isPending}
          error={categories.isError}
          retry={() => void categories.refetch()}
        />
      ) : (
        display.slice(0, limit).map((category, n) => (
          <Link
            className="category-feature"
            key={category.id}
            to={`/san-pham?category=${encodeURIComponent(category.id)}#catalog-results`}
          >
            <ContentImage
              src={
                category.featuredMediaId
                  ? `${api.defaults.baseURL}/media/${category.featuredMediaId}`
                  : '/assets/garment-study.svg'
              }
              alt={category.featuredMediaAlt || category.title}
              width={700}
              height={800}
            />
            <span className="category-feature-copy">
              <small>
                {String(n + 1).padStart(2, '0')} / {vi ? 'DANH MỤC' : 'CATEGORY'}
              </small>
              <h3>{category.title}</h3>
              {!compact && <p>{category.excerpt}</p>}
              <span>
                {vi ? 'Xem sản phẩm' : 'Explore products'} <ArrowUpRight size={18} />
              </span>
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
