import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import type { Content, PageResult } from '../../types';
import { State, ArrowLink } from '../common/Shared';
import CorporateBody from './CorporateBody';
function QualityRecord({ item }: { item: Content }) {
  const { i18n } = useTranslation();
  const detail = useQuery({
    queryKey: ['public', 'certifications', item.id, i18n.language],
    queryFn: async () =>
      (
        await api.get<Content>(`/public/certifications/${item.canonicalSlug || item.slug}`, {
          params: { locale: i18n.language },
        })
      ).data,
  });
  return (
    <section className="quality-record">
      <div className="quality-record-heading">
        <div className="eyebrow">HUGAMEX / RECORDS</div>
        <h2>{item.title}</h2>
        <p>{item.excerpt}</p>
      </div>
      {detail.isPending || detail.isError ? (
        <State
          loading={detail.isPending}
          error={detail.isError}
          retry={() => void detail.refetch()}
        />
      ) : (
        detail.data && <CorporateBody article={detail.data} />
      )}
      {item.metadata.issuer && (
        <p>
          {i18n.language === 'vi' ? 'Tổ chức cấp:' : 'Issuer:'} {item.metadata.issuer}
        </p>
      )}
      {item.metadata.validUntil && (
        <p>
          {i18n.language === 'vi' ? 'Hạn ghi trong hồ sơ:' : 'Date recorded:'}{' '}
          {item.metadata.validUntil}
        </p>
      )}
      {item.metadata.documentMediaId && (
        <a
          className="arrow-link"
          href={`${api.defaults.baseURL}/media/${item.metadata.documentMediaId}`}
        >
          PDF
        </a>
      )}
    </section>
  );
}
export default function QualityRecords({ items }: { items: PageResult<Content>['items'] }) {
  const { i18n } = useTranslation();
  return (
    <div className="quality-records">
      <div className="quality-intro">
        <span className="eyebrow">QUALITY / RESPONSIBILITY</span>
        <h2>
          {i18n.language === 'vi'
            ? 'Chất lượng. Trách nhiệm.\nNhững dấu mốc được ghi nhận.'
            : 'Quality. Responsibility.\nRecognition over time.'}
        </h2>
        <p>
          {i18n.language === 'vi'
            ? 'Phân biệt rõ tư liệu lịch sử và hồ sơ chứng nhận hiện hành khi trao đổi yêu cầu.'
            : 'Historical references and current certification documents are distinguished for every enquiry.'}
        </p>
        <ArrowLink to="/lien-he">
          {i18n.language === 'vi' ? 'Trao đổi yêu cầu chứng từ' : 'Discuss supporting documents'}
        </ArrowLink>
      </div>
      {items.map((item) => (
        <QualityRecord key={item.id} item={item} />
      ))}
      {!items.length && <State />}
    </div>
  );
}
