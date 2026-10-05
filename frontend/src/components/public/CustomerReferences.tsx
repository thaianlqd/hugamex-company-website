import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { ArrowLink, RichText, State } from '../common/Shared';
import BrandImage from './BrandImage';
import type { Content, PageResult } from '../../types';
export function CustomerRecord({ item, compact }: { item: Content; compact: boolean }) {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const detail = useQuery({
    queryKey: ['public', 'partners', item.id, i18n.language],
    queryFn: async () =>
      (
        await api.get<Content>(`/public/partners/${item.canonicalSlug || item.slug}`, {
          params: { locale: i18n.language },
        })
      ).data,
    enabled: !compact,
  });
  const names = (item.metadata.customerNames || '').split('|').filter(Boolean);
  const composition = (item.metadata.composition || '')
    .split('|')
    .map((value) => {
      const [name, percent] = value.split(':');
      return { name, percent: Number(percent) };
    })
    .filter(
      (value) =>
        value.name && Number.isFinite(value.percent) && value.percent > 0 && value.percent <= 100,
    );
  return (
    <section className="customer-record">
      <div className="customer-reference-layout">
        <BrandImage photo="cooperation" />
        <div>
          <div className="eyebrow">
            {vi ? 'THEO HỒ SƠ' : 'PROFILE REFERENCES'} / {item.metadata.referenceYear || '—'}
          </div>
          <h2>{compact ? (vi ? 'Khách hàng tiêu biểu' : 'Customer references') : item.title}</h2>
          <p>{item.excerpt}</p>
          {names.length ? (
            <ul className="customer-names">
              {names.map((name, n) => (
                <li key={name}>
                  <small>{String(n + 1).padStart(2, '0')}</small>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ArrowLink to={`/doi-tac/${item.canonicalSlug || item.slug}`}>
              {vi ? 'Khám phá hồ sơ' : 'Explore the record'}
            </ArrowLink>
          )}
          {item.metadata.referenceYear && (
            <p className="source-note">
              {vi
                ? 'Tên tham chiếu trong tư liệu lịch sử; không xác nhận hợp đồng hay quan hệ hiện tại.'
                : 'Names referenced in historical material; current contracts or relationships are not asserted.'}
            </p>
          )}
        </div>
      </div>
      {!compact && composition.length > 0 && (
        <section
          className="composition"
          aria-label={
            vi
              ? `Cơ cấu kinh doanh năm ${item.metadata.referenceYear}`
              : `${item.metadata.referenceYear} business composition`
          }
        >
          <div>
            <div className="eyebrow">BUSINESS COMPOSITION / {item.metadata.referenceYear}</div>
            <h2>
              {vi ? 'Cơ cấu kinh doanh\ntrong hồ sơ.' : 'Business composition\nin the profile.'}
            </h2>
            <p className="source-note">
              {vi
                ? `Tỷ trọng theo tài liệu năm ${item.metadata.referenceYear}, không phải số liệu kinh doanh hiện tại.`
                : `Shares from the ${item.metadata.referenceYear} material, not current business figures.`}
            </p>
          </div>
          <div className="composition-values">
            {composition.map(({ name, percent }) => (
              <div key={name}>
                <div>
                  <span>{name === 'Other' && vi ? 'Khác' : name}</span>
                  <strong>{percent}%</strong>
                </div>
                <span className="composition-track" aria-hidden="true">
                  <span style={{ width: `${percent}%` }} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {!compact &&
        (detail.isPending || detail.isError ? (
          <State
            loading={detail.isPending}
            error={detail.isError}
            retry={() => void detail.refetch()}
          />
        ) : (
          detail.data && (
            <div className="customer-notes prose">
              <RichText node={detail.data.content} />
            </div>
          )
        ))}
    </section>
  );
}
export default function CustomerReferences({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const query = useQuery({
    queryKey: ['customer-references', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/partners', {
          params: { locale: i18n.language, size: 50 },
        })
      ).data,
  });
  if (query.isPending || query.isError)
    return (
      <State loading={query.isPending} error={query.isError} retry={() => void query.refetch()} />
    );
  if (!query.data?.items.length) return <State />;
  return (
    <div className="customer-references">
      {(compact ? query.data.items.slice(0, 1) : query.data.items).map((item) => (
        <CustomerRecord key={item.id} item={item} compact={compact} />
      ))}
    </div>
  );
}
