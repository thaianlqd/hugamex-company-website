import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { api, errorMessage } from '../services/api';
import { ContentCard, RichText, Seo, State, ArrowLink } from '../components/common/Shared';
import BrandImage, { type PhotoKey } from '../components/public/BrandImage';
import CustomerReferences, { CustomerRecord } from '../components/public/CustomerReferences';
import QualityRecords from '../components/public/QualityRecords';
import { useProductCategories } from '../components/public/CategoryShowcase';
import CorporateBody from '../components/public/CorporateBody';
import BranchNetwork from '../components/public/BranchNetwork';
import ProductCatalog from '../components/public/ProductCatalog';
import ArticleBody from '../components/public/ArticleBody';
import LocationMap from '../components/public/LocationMap';
import { Search } from 'lucide-react';
import ContentImage from '../components/common/ContentImage';
import { Reveal } from '../components/common/Reveal';
import type { Content, PageResult } from '../types';
export const routes: Record<string, [string, string, string?]> = {
  '/gioi-thieu': ['about', 'pages', 'gioi-thieu'],
  '/gioi-thieu/lich-su': ['history', 'pages', 'lich-su'],
  '/gioi-thieu/tam-nhin-su-menh': ['vision', 'pages', 'tam-nhin-su-menh'],
  '/nang-luc-san-xuat': ['manufacturing', 'pages', 'nang-luc-san-xuat'],
  '/san-pham': ['products', 'products'],
  '/he-thong': ['network', 'branches'],
  '/doi-tac': ['partners', 'partners'],
  '/chung-nhan': ['certifications', 'certifications'],
  '/phat-trien-ben-vung': ['sustainability', 'pages', 'phat-trien-ben-vung'],
  '/tin-tuc': ['news', 'posts'],
  '/tuyen-dung': ['careers', 'pages', 'tuyen-dung'],
  '/chinh-sach-bao-mat': ['privacy', 'pages', 'chinh-sach-bao-mat'],
};
export default function PublicContent() {
  const { pathname } = useLocation();
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const detail = !!slug;
  const config =
    routes[pathname] ||
    (pathname.startsWith('/tin-tuc/')
      ? ['news', 'posts']
      : pathname.startsWith('/san-pham/')
        ? ['products', 'products']
        : pathname.startsWith('/doi-tac/')
          ? ['partners', 'partners']
          : pathname.startsWith('/chung-nhan/')
            ? ['certifications', 'certifications']
            : ['network', 'branches']);
  const [label, resource, staticSlug] = config;
  const single = slug || staticSlug;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [shareFeedback, setShareFeedback] = useState('');
  const query = useQuery({
    queryKey: ['public', resource, single, i18n.language, search, page, category],
    queryFn: async () =>
      (
        await api.get<Content | PageResult<Content>>(
          `/public/${resource}${single ? `/${single}` : ''}`,
          {
            params: {
              locale: i18n.language,
              search: single || resource === 'branches' ? '' : search,
              page,
              size: 9,
              category: resource === 'posts' ? category || undefined : undefined,
            },
          },
        )
      ).data,
    retry: false,
    enabled: !(resource === 'products' && !single),
  });
  const categories = useQuery({
    queryKey: ['categories', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/categories', {
          params: { locale: i18n.language, size: 50 },
        })
      ).data,
    enabled: resource === 'posts' && !single,
  });
  const missing = isAxiosError(query.error) && query.error.response?.status === 404;
  const data = query.data;
  const article = data && 'title' in data ? data : undefined;
  const listing = data && 'items' in data ? data : undefined;
  const title = article?.title || t(label);
  const isBranch = resource === 'branches';
  const productCategories = useProductCategories(resource === 'products');
  const related = useQuery({
    queryKey: ['public', 'related', article?.id, i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/posts', {
          params: { locale: i18n.language, size: 4, category: article?.categoryIds[0] },
        })
      ).data,
    enabled: resource === 'posts' && !!article,
  });
  const base =
    Object.entries(routes).find(([, value]) => value[1] === resource && !value[2])?.[0] || '/';
  return (
    <>
      <Seo
        title={article?.seoTitle || title}
        description={article?.seoDescription || article?.excerpt}
        path={pathname}
        noIndex={missing}
        breadcrumbs={
          detail
            ? [
                { name: t('home'), path: '/' },
                { name: t(label), path: base },
                { name: title, path: pathname },
              ]
            : [
                { name: t('home'), path: '/' },
                { name: title, path: pathname },
              ]
        }
        image={
          article?.featuredMediaId
            ? `${api.defaults.baseURL}/media/${article.featuredMediaId}`
            : undefined
        }
        article={resource === 'posts' && article ? { publishedAt: article.publishedAt } : undefined}
      />
      <header className={`page-header${resource === 'posts' && single ? ' journal-header' : ''}`}>
        <div className="breadcrumb">
          <Link to="/">{t('home')}</Link> / {detail && <Link to={base}>{t(label)} / </Link>}
          {title}
        </div>
        <div className="eyebrow">HUGAMEX / {t(label).toUpperCase()}</div>
        <Reveal>
          <h1>{title}</h1>
        </Reveal>
        {article?.excerpt && <p>{article.excerpt}</p>}
        {article?.publishedAt && resource === 'posts' && (
          <div className="meta">
            {new Date(article.publishedAt).toLocaleDateString(i18n.language)}
          </div>
        )}
      </header>
      {!single && ['products', 'partners', 'certifications', 'posts'].includes(resource) && (
        <div className={`public-masthead masthead-${resource}`}>
          <BrandImage
            photo={
              (
                {
                  products: 'fabricDetail',
                  partners: 'vision',
                  certifications: 'finishing',
                  posts: 'cutting',
                } as Record<string, PhotoKey>
              )[resource]
            }
          />
        </div>
      )}
      <div className="page-body">
        {pathname === '/gioi-thieu' && (
          <div className="toolbar">
            <ArrowLink to="/gioi-thieu/lich-su">{t('history')}</ArrowLink>
            <ArrowLink to="/gioi-thieu/tam-nhin-su-menh">{t('vision')}</ArrowLink>
          </div>
        )}
        {!single && !['products', 'branches', 'partners', 'certifications'].includes(resource) && (
          <div className="public-filter">
            <label className="catalog-search" htmlFor="public-search">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">{t('search')}</span>
              <input
                id="public-search"
                type="search"
                maxLength={200}
                placeholder={
                  i18n.language === 'vi' ? 'Tìm kiếm bài viết, chủ đề…' : 'Search articles, topics…'
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            {resource === 'posts' && (
              <select
                aria-label={i18n.language === 'vi' ? 'Danh mục' : 'Category'}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t('viewAll')}</option>
                {categories.data?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        {resource === 'partners' && !single ? (
          <CustomerReferences />
        ) : resource === 'products' && !single ? (
          <ProductCatalog />
        ) : missing ? (
          <div className="state">
            <h2>404</h2>
            <p>
              {i18n.language === 'vi'
                ? 'Nội dung này chưa có hoặc chưa được xuất bản.'
                : 'This content is unavailable or has not been published.'}
            </p>
            <ArrowLink to={base}>{t('back')}</ArrowLink>
          </div>
        ) : query.isPending || query.isError ? (
          <State
            loading={query.isPending}
            error={query.isError}
            retry={() => void query.refetch()}
          />
        ) : article ? (
          <>
            {resource === 'products' && (
              <nav
                className="product-category-trail"
                aria-label={i18n.language === 'vi' ? 'Danh mục của sản phẩm' : 'Product categories'}
              >
                <Link to="/san-pham">{t('products')}</Link>
                <span>/</span>
                {productCategories.data?.items
                  .filter((category) => article.categoryIds.includes(category.id))
                  .map((category) => (
                    <Link
                      key={category.id}
                      to={`/san-pham?category=${category.id}#catalog-results`}
                    >
                      {category.title}
                    </Link>
                  ))}
                <span>/ {article.title}</span>
              </nav>
            )}
            {article.featuredMediaId && resource !== 'partners' && (
              <ContentImage
                className="article-hero"
                src={`${api.defaults.baseURL}/media/${article.featuredMediaId}`}
                alt={article.featuredMediaAlt || article.title}
                width="1200"
                height="675"
              />
            )}
            {resource === 'partners' ? (
              <CustomerRecord item={article} compact={false} />
            ) : resource === 'pages' ? (
              <CorporateBody article={article} />
            ) : resource === 'posts' ? (
              <ArticleBody
                article={article}
                feedback={shareFeedback}
                onShare={() => {
                  void navigator.clipboard
                    .writeText(window.location.href)
                    .then(() =>
                      setShareFeedback(
                        i18n.language === 'vi' ? 'Đã sao chép liên kết.' : 'Link copied.',
                      ),
                    )
                    .catch((e) => setShareFeedback(errorMessage(e)));
                }}
              />
            ) : (
              <div className="prose">
                <RichText node={article.content} />
                {['branches', 'products', 'partners', 'certifications'].includes(resource) && (
                  <dl className="branch-details">
                    {Object.entries(article.metadata)
                      .filter(
                        ([key]) =>
                          !!article.metadata[key] &&
                          ![
                            'mapUrl',
                            'latitude',
                            'longitude',
                            'documentMediaId',
                            'website',
                          ].includes(key),
                      )
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt>{t(key)}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    {article.metadata.mapUrl && (
                      <a
                        className="arrow-link"
                        href={article.metadata.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Maps
                      </a>
                    )}
                  </dl>
                )}
                {article.metadata.website && (
                  <a
                    className="arrow-link"
                    href={article.metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('website')}
                  </a>
                )}
                {article.metadata.documentMediaId && (
                  <a
                    className="arrow-link"
                    href={`${api.defaults.baseURL}/media/${article.metadata.documentMediaId}`}
                  >
                    PDF
                  </a>
                )}
              </div>
            )}
            {resource === 'branches' && article.metadata.address && (
              <div className="facility-map">
                <LocationMap address={article.metadata.address} label={article.title} />
              </div>
            )}
            {resource === 'posts' &&
              !!related.data?.items.filter((item) => item.id !== article.id).length && (
                <section className="related-posts">
                  <h2>{i18n.language === 'vi' ? 'Bài viết khác' : 'More articles'}</h2>
                  <div className="article-grid">
                    {related.data.items
                      .filter((item) => item.id !== article.id)
                      .slice(0, 3)
                      .map((item) => (
                        <ContentCard key={item.id} item={item} base="/tin-tuc" />
                      ))}
                  </div>
                </section>
              )}
          </>
        ) : resource === 'certifications' ? (
          <QualityRecords items={listing?.items || []} />
        ) : isBranch ? (
          <BranchNetwork items={listing?.items || []} />
        ) : listing?.items.length ? (
          <>
            <h2 className="listing-title">
              {i18n.language === 'vi'
                ? resource === 'posts'
                  ? 'Tin tức & góc nhìn'
                  : 'Khám phá thêm'
                : resource === 'posts'
                  ? 'News & perspectives'
                  : 'Explore more'}
            </h2>
            <div className={isBranch ? '' : 'article-grid'}>
              {isBranch ? (
                <BranchNetwork items={listing.items} />
              ) : (
                listing.items.map((item) => (
                  <ContentCard key={item.id} item={item} base={pathname} />
                ))
              )}
            </div>
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                {t('previous')}
              </button>
              <span>
                {page + 1} / {Math.ceil(listing.total / listing.size)}
              </span>
              <button
                disabled={(page + 1) * listing.size >= listing.total}
                onClick={() => setPage(page + 1)}
              >
                {t('next')}
              </button>
            </div>
          </>
        ) : (
          <div className="public-empty">
            <div className="eyebrow">HUGAMEX</div>
            <h2>{i18n.language === 'vi' ? 'Cùng khám phá thêm' : 'Let’s explore further'}</h2>
            <p>
              {i18n.language === 'vi'
                ? 'Chưa có nội dung phù hợp. Bạn có thể đổi bộ lọc hoặc chia sẻ nhu cầu với chúng tôi.'
                : 'No matching content yet. Try another filter or share your requirements with us.'}
            </p>
            <ArrowLink to="/lien-he">{t('contact')}</ArrowLink>
          </div>
        )}
      </div>
    </>
  );
}
