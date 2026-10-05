import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { State } from '../../components/common/Shared';
import { useAuth } from '../auth/AuthProvider';
import type { Content, PageResult } from '../../types';
export default function Dashboard() {
  const q = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await api.get<Record<string, number>>('/admin/dashboard')).data,
  });
  const { i18n, t } = useTranslation();
  const auth = useAuth();
  const recent = useQuery({
    queryKey: ['admin', 'recent-posts', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/admin/posts', {
          params: { size: 5, locale: i18n.language },
        })
      ).data,
  });
  const contacts = useQuery({
    queryKey: ['admin', 'recent-contacts'],
    enabled: !!auth.user?.roles.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r)),
    queryFn: async () =>
      (
        await api.get<PageResult<Record<string, unknown>>>('/admin/contact-messages', {
          params: { size: 5 },
        })
      ).data,
  });
  const labels: Record<string, string> =
    i18n.language === 'vi'
      ? {
          DRAFT: 'Bản nháp',
          PUBLISHED: 'Đã xuất bản',
          ARCHIVED: 'Đã lưu trữ',
          MEDIA: 'Tệp media',
          NEW_CONTACTS: 'Liên hệ mới',
        }
      : {
          DRAFT: 'Drafts',
          PUBLISHED: 'Published',
          ARCHIVED: 'Archived',
          MEDIA: 'Media files',
          NEW_CONTACTS: 'New contacts',
        };
  return (
    <>
      <div className="admin-page-head">
        <h1>{i18n.language === 'vi' ? 'Tổng quan' : 'Overview'}</h1>
      </div>
      <p className="notice">
        {i18n.language === 'vi'
          ? 'Tạo bản nháp → thêm bản dịch và hình ảnh → xem trước → xuất bản. Nội dung doanh nghiệp cần được xác nhận trước khi xuất bản.'
          : 'Create draft → add translations and media → preview → publish. Verify company facts before publishing.'}
      </p>
      {q.isPending || q.isError ? (
        <State loading={q.isPending} error={q.isError} retry={() => void q.refetch()} />
      ) : (
        <div className="dashboard-stats">
          {Object.entries(q.data || {})
            .filter(([key]) => key !== 'ARCHIVED')
            .map(([key, value]) => (
              <div key={key}>
                <span>{labels[key] || key}</span>
                <strong>{value}</strong>
              </div>
            ))}
        </div>
      )}
      <div className="dashboard-recent">
        <section className="panel">
          <h2>{i18n.language === 'vi' ? 'Bài viết gần đây' : 'Recent articles'}</h2>
          {recent.isPending || recent.isError ? (
            <State loading={recent.isPending} error={recent.isError} />
          ) : recent.data?.items.length ? (
            recent.data.items.map((item) => (
              <Link className="recent-row" key={item.id} to={`/admin/posts/${item.id}`}>
                <span>{item.title}</span>
                <span className={`status ${item.status.toLowerCase()}`}>
                  {t(item.status.toLowerCase())}
                </span>
              </Link>
            ))
          ) : (
            <State />
          )}
        </section>
        {!!auth.user?.roles.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r)) && (
          <section className="panel">
            <h2>{i18n.language === 'vi' ? 'Liên hệ gần đây' : 'Recent enquiries'}</h2>
            {contacts.isPending || contacts.isError ? (
              <State loading={contacts.isPending} error={contacts.isError} />
            ) : contacts.data?.items.length ? (
              contacts.data.items.map((item) => (
                <Link className="recent-row" key={String(item.id)} to="/admin/contact-messages">
                  <span>{String(item.subject || '')}</span>
                  <small>{String(item.status || '')}</small>
                </Link>
              ))
            ) : (
              <State />
            )}
          </section>
        )}
      </div>
    </>
  );
}
