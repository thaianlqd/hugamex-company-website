import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, errorMessage } from '../../services/api';
import { State } from '../../components/common/Shared';
import Field from '../../components/common/Field';
import { useAuth } from '../auth/AuthProvider';
import { resources } from './AdminLayout';
import { useAdminDialog, useAdminToast } from '../../components/admin/useAdminFeedback';
import type { PageResult } from '../../types';
import Pagination from './AdminPagination';
type Raw = Record<string, unknown>;
export function Records({ resource }: { resource: 'users' | 'contact-messages' | 'audit-logs' }) {
  const { t, i18n } = useTranslation();
  const { confirm, dialogNode } = useAdminDialog();
  const { toast, toastNode } = useAdminToast();
  const auth = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Raw | null>(null);
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ['admin', resource, page, search],
    queryFn: async () =>
      (await api.get<PageResult<Raw>>(`/admin/${resource}`, { params: { page, search } })).data,
  });
  const action = async (id: string, path: string, value: string) => {
    await confirm(
      i18n.language === 'vi'
        ? `Xác nhận thay đổi ${path === 'role' ? 'quyền truy cập' : 'trạng thái'}: ${value}?`
        : `Confirm ${path}: ${value}?`,
      async () => {
        setError('');
        setBusy(true);
        try {
          await api.patch(
            resource === 'contact-messages'
              ? `/admin/${resource}/${id}`
              : `/admin/${resource}/${id}/${path}`,
            { [path]: value },
          );
          await client.invalidateQueries({ queryKey: ['admin'] });
          toast(i18n.language === 'vi' ? 'Đã cập nhật.' : 'Updated.');
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setBusy(false);
        }
      },
    );
  };
  const resetMfa = async (id: string) => {
    await confirm(
      i18n.language === 'vi'
        ? 'Đặt lại MFA và thu hồi mọi phiên đăng nhập của tài khoản này?'
        : 'Reset MFA and revoke all sessions for this account?',
      async () => {
        setBusy(true);
        setError('');
        try {
          await api.post(`/admin/users/${id}/reset-mfa`);
          await client.invalidateQueries({ queryKey: ['admin'] });
          toast(i18n.language === 'vi' ? 'Đã cập nhật.' : 'Updated.');
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setBusy(false);
        }
      },
    );
  };
  const columns =
    resource === 'users'
      ? ['name', 'email', 'status', 'roles']
      : resource === 'contact-messages'
        ? ['full_name', 'email', 'subject', 'status', 'notification_status']
        : ['timestamp', 'action', 'entity_type', 'entity_id'];
  return (
    <>
      {dialogNode}
      {toastNode}
      <div className="admin-page-head">
        <h1>{i18n.language === 'vi' ? resources[resource] : resource.replaceAll('-', ' ')}</h1>
      </div>
      {resource === 'users' && <CreateUser />}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="toolbar">
        <input
          className="search"
          aria-label={t('search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder={t('search')}
        />
      </div>
      {q.isPending || q.isError ? (
        <State loading={q.isPending} error={q.isError} retry={() => void q.refetch()} />
      ) : !q.data?.items.length ? (
        <State />
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>
                      {(
                        {
                          name: t('name'),
                          email: t('email'),
                          full_name: t('name'),
                          subject: t('subject'),
                          notification_status:
                            i18n.language === 'vi' ? 'Email thông báo' : 'Email notification',
                          status: t('status'),
                          roles: i18n.language === 'vi' ? 'Vai trò' : 'Roles',
                          timestamp: i18n.language === 'vi' ? 'Thời điểm' : 'Timestamp',
                          action: i18n.language === 'vi' ? 'Thao tác' : 'Action',
                          entity_type: i18n.language === 'vi' ? 'Đối tượng' : 'Entity',
                          entity_id: 'ID',
                        } as Record<string, string>
                      )[c] || c}
                    </th>
                  ))}
                  <th>{i18n.language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {q.data.items.map((row) => (
                  <tr key={String(row.id)}>
                    {columns.map((c) => (
                      <td key={c}>
                        {c === 'notification_status' ? (
                          <span
                            className={`status ${row[c] === 'SENT' ? 'published' : row[c] === 'FAILED' ? 'archived' : 'draft'}`}
                          >
                            {(
                              {
                                SENT: i18n.language === 'vi' ? 'Đã gửi' : 'Sent',
                                PENDING: i18n.language === 'vi' ? 'Chờ gửi' : 'Pending',
                                RETRY: i18n.language === 'vi' ? 'Chờ gửi lại' : 'Retrying',
                                FAILED: i18n.language === 'vi' ? 'Gửi thất bại' : 'Failed',
                                DISABLED: i18n.language === 'vi' ? 'Chưa bật' : 'Disabled',
                              } as Record<string, string>
                            )[String(row[c])] || '—'}
                          </span>
                        ) : Array.isArray(row[c]) ? (
                          row[c].join(', ')
                        ) : (
                          String(row[c] || '—')
                        )}
                      </td>
                    ))}
                    <td>
                      <button className="text-button" onClick={() => setDetail(row)}>
                        {t('viewAll')}
                      </button>
                      {resource === 'users' && (
                        <>
                          <button
                            disabled={busy}
                            className="text-button"
                            onClick={() =>
                              void action(
                                String(row.id),
                                'status',
                                row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                              )
                            }
                          >
                            {row.status === 'ACTIVE'
                              ? i18n.language === 'vi'
                                ? 'Vô hiệu hóa'
                                : 'Disable'
                              : i18n.language === 'vi'
                                ? 'Kích hoạt'
                                : 'Enable'}
                          </button>
                          {auth.user?.roles.includes('SUPER_ADMIN') &&
                            String(row.id) !== auth.user.id && (
                              <button
                                disabled={busy}
                                className="text-button"
                                onClick={() => void resetMfa(String(row.id))}
                              >
                                {i18n.language === 'vi' ? 'Đặt lại MFA' : 'Reset MFA'}
                              </button>
                            )}
                          {auth.user?.roles.includes('SUPER_ADMIN') && (
                            <select
                              aria-label={`Role ${row.email}`}
                              disabled={busy}
                              value={(row.roles as string[])[0]}
                              onChange={(e) => void action(String(row.id), 'role', e.target.value)}
                            >
                              {['USER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].map((r) => (
                                <option key={r}>{r}</option>
                              ))}
                            </select>
                          )}
                        </>
                      )}
                      {resource === 'contact-messages' && (
                        <select
                          disabled={busy}
                          aria-label={`Status ${row.subject}`}
                          value={String(row.status)}
                          onChange={(e) => void action(String(row.id), 'status', e.target.value)}
                        >
                          {['NEW', 'READ', 'REPLIED', 'ARCHIVED'].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} setPage={setPage} total={q.data.total} size={q.data.size} />
        </>
      )}
      {detail && (
        <div className="panel">
          <button className="text-button" onClick={() => setDetail(null)}>
            {t('close')}
          </button>
          <dl>
            {Object.entries(detail).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  );
}
function CreateUser() {
  const auth = useAuth();
  const { t } = useTranslation();
  const client = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const schema = z.object({
    email: z.string().email().max(254),
    name: z.string().min(1).max(120),
    role: z.enum(['USER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN']),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'USER' },
  });
  return (
    <details className="panel">
      <summary>{t('create')}</summary>
      <p className="notice">
        Email verification + password reset required. Privileged accounts must set up MFA. Recent
        authentication is required.
      </p>
      <form
        onSubmit={form.handleSubmit(async (v) => {
          setError('');
          try {
            await api.post('/admin/users', v);
            await client.invalidateQueries({ queryKey: ['admin'] });
            setSuccess(true);
            form.reset();
          } catch (e) {
            setError(errorMessage(e));
          }
        })}
      >
        {(['email', 'name'] as const).map((k) => (
          <Field
            key={k}
            id={`new-user-${k}`}
            label={t(k)}
            error={form.formState.errors[k]?.message}
          >
            <input id={`new-user-${k}`} {...form.register(k)} />
          </Field>
        ))}
        <Field id="new-user-role" label="Role">
          <select id="new-user-role" {...form.register('role')}>
            {(auth.user?.roles.includes('SUPER_ADMIN')
              ? ['USER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN']
              : ['USER', 'EDITOR']
            ).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="success">
            {t('sent')}
          </p>
        )}
        <button className="button" disabled={form.formState.isSubmitting}>
          {t('create')}
        </button>
      </form>
    </details>
  );
}
export function Roles() {
  const { i18n } = useTranslation();
  const q = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => (await api.get<string[]>('/admin/roles')).data,
  });
  return (
    <>
      <div className="admin-page-head">
        <h1>{i18n.language === 'vi' ? 'Phân quyền' : 'Permissions'}</h1>
      </div>
      <p className="notice">
        {i18n.language === 'vi'
          ? 'Thay đổi vai trò tại Người dùng. Thao tác yêu cầu SUPER_ADMIN, MFA và đăng nhập gần đây. Không thể hạ quyền hoặc vô hiệu hóa SUPER_ADMIN hoạt động cuối cùng.'
          : 'Manage roles under Users. Changes require SUPER_ADMIN, MFA and recent authentication. The last active SUPER_ADMIN cannot be demoted or disabled.'}
      </p>
      {q.isPending || q.isError ? (
        <State loading={q.isPending} error={q.isError} />
      ) : (
        <ul>
          {q.data?.map((r) => (
            <li className="panel" key={r}>
              {r}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
