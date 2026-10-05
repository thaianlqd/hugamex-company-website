import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Content, RichNode } from '../../types';
import type { ReactNode } from 'react';
export function Seo({
  title,
  description,
  path,
  image,
  article,
  noIndex,
  organization,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  article?: { publishedAt: string | null };
  noIndex?: boolean;
  organization?: boolean;
  breadcrumbs?: { name: string; path: string }[];
}) {
  const site = import.meta.env.VITE_SITE_URL;
  const privatePage =
    /^\/(admin|tai-khoan|dang-nhap|dang-ky|xac-thuc-email|quen-mat-khau|dat-lai-mat-khau)(\/|$)/.test(
      path,
    );
  const { i18n } = useTranslation();
  const url = site ? `${site.replace(/\/$/, '')}${path}` : undefined;
  const imageUrl = image && site ? new URL(image, site).href : image;
  const structured =
    article && url
      ? {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: title,
          description,
          datePublished: article.publishedAt || undefined,
          mainEntityOfPage: url,
          inLanguage: i18n.language,
          image: imageUrl,
          publisher: { '@type': 'Organization', name: 'HUGAMEX' },
        }
      : undefined;
  const graph: Record<string, unknown>[] = [];
  if (structured) graph.push(structured);
  if (organization && site)
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Công ty Cổ phần May Hữu Nghị',
      alternateName: 'HUGAMEX',
      url: site,
    });
  if (breadcrumbs && site)
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: new URL(item.path, site).href,
      })),
    });
  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{`${title} | HUGAMEX`}</title>
      <meta name="description" content={description || title} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || title} />
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta name="twitter:card" content="summary_large_image" />
      {url && <meta property="og:url" content={url} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta
        name="robots"
        content={
          import.meta.env.VITE_APP_ENV === 'production' && !privatePage && !noIndex
            ? 'index,follow'
            : 'noindex,nofollow'
        }
      />
      {url && <link rel="canonical" href={url} />}
      {graph.length > 0 && (
        <script type="application/ld+json">{JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
      )}
    </Helmet>
  );
}
export function ArrowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="arrow-link" to={to}>
      {children}
      <ArrowUpRight size={18} />
    </Link>
  );
}
export function State({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="state" role={error ? 'alert' : 'status'}>
      {t(loading ? 'loading' : error ? 'error' : 'empty')}
      {error && retry && <button onClick={retry}>{t('retry')}</button>}
    </div>
  );
}
export function RichText({ node }: { node: RichNode }) {
  const children = node.content?.map((n, i) => <RichText key={i} node={n} />);
  switch (node.type) {
    case 'text': {
      let text: ReactNode = node.text;
      for (const mark of node.marks || []) {
        if (mark.type === 'bold') text = <strong>{text}</strong>;
        if (mark.type === 'italic') text = <em>{text}</em>;
        if (mark.type === 'strike') text = <s>{text}</s>;
        if (mark.type === 'code') text = <code>{text}</code>;
        if (mark.type === 'link') {
          const url = String(mark.attrs?.href || '');
          if (/^https?:\/\//.test(url))
            text = (
              <a href={url} rel="noopener noreferrer">
                {text}
              </a>
            );
        }
      }
      return <>{text}</>;
    }
    case 'paragraph':
      return <p>{children}</p>;
    case 'heading':
      return node.attrs?.level === 3 ? <h3>{children}</h3> : <h2>{children}</h2>;
    case 'bulletList':
      return <ul>{children}</ul>;
    case 'orderedList':
      return (
        <ol start={typeof node.attrs?.start === 'number' ? node.attrs.start : undefined}>
          {children}
        </ol>
      );
    case 'listItem':
      return <li>{children}</li>;
    case 'blockquote':
      return <blockquote>{children}</blockquote>;
    case 'hardBreak':
      return <br />;
    case 'horizontalRule':
      return <hr />;
    default:
      return <>{children}</>;
  }
}
export function ContentCard({ item, base }: { item: Content; base: string }) {
  return (
    <article className="content-card">
      <Link to={`${base}/${item.canonicalSlug || item.slug}`}>
        <img
          src={
            item.featuredMediaId
              ? `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/media/${item.featuredMediaId}`
              : '/assets/garment-study.svg'
          }
          alt={item.featuredMediaAlt || item.title}
          width="600"
          height="450"
          loading="lazy"
        />
        <div className="meta">
          {item.publishedAt && new Date(item.publishedAt).toLocaleDateString(item.locale)}
        </div>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <ArrowUpRight className="card-arrow" size={24} />
      </Link>
    </article>
  );
}
