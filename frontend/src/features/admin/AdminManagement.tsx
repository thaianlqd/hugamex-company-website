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
import type { PageResult } from '../../types';
import Pagination from './AdminPagination';
export function Dashboard() {
  const q = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await api.get<Record<string, number>>('/admin/dashboard')).data,
  });
  const { i18n } = useTranslation();
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
          {Object.entries(q.data || {}).map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
type Media = {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  altText: string;
  isPublic: boolean;
};
export function MediaLibrary() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const queryClient = useQueryClient();
  const schema = z.object({ altText: z.string().max(500), isPublic: z.boolean() });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { altText: '', isPublic: false },
  });
  const [file, setFile] = useState<File | null>(null);
  const q = useQuery({
    queryKey: ['admin', 'media', page, search],
    queryFn: async () =>
      (await api.get<PageResult<Media>>('/admin/media', { params: { page, search } })).data,
  });
  const upload = form.handleSubmit(async (v) => {
    setError('');
    setSuccess('');
    if (!file) {
      setError(i18n.language === 'vi' ? 'Vui lòng chọn tệp.' : 'Choose a file.');
      return;
    }
    const body = new FormData();
    body.append('file', file);
    body.append('altText', v.altText);
    body.append('isPublic', String(v.isPublic));
    setBusy(true);
    try {
      await api.post('/admin/media', body);
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      setSuccess(t('sent'));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  });
  const download = async (id: string) => {
    try {
      const { data } = await api.get<Blob>(`/media/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = q.data?.items.find((m) => m.id === id)?.originalFilename || 'media';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const remove = async (id: string) => {
    if (
      !window.confirm(
        i18n.language === 'vi'
          ? 'Xóa tệp này? Tệp đang được sử dụng sẽ không thể xóa.'
          : 'Delete this file? Referenced files are protected.',
      )
    )
      return;
    try {
      await api.delete(`/admin/media/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <>
      <div className="admin-page-head">
        <h1>{i18n.language === 'vi' ? 'Thư viện media' : 'Media library'}</h1>
      </div>
      <form onSubmit={upload} className="panel">
        <div className="form-grid">
          <Field id="mediaFile" label="JPEG / PNG / WebP ≤ 5 MB · PDF ≤ 10 MB">
            <input
              id="mediaFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Field>
          <Field id="altText" label="Alt text" error={form.formState.errors.altText?.message}>
            <input id="altText" {...form.register('altText')} />
          </Field>
        </div>
        <label className="check-field">
          <input type="checkbox" {...form.register('isPublic')} />
          {i18n.language === 'vi'
            ? 'Công khai (cho phép xem không cần đăng nhập)'
            : 'Public (visible without authentication)'}
        </label>
        <button className="button" disabled={busy}>
          {busy ? t('loading') : 'Upload'}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
      {editing && <MediaEdit key={editing.id} media={editing} close={() => setEditing(null)} />}
      <div className="toolbar">
        <input
          className="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          aria-label={t('search')}
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
                  <th>File</th>
                  <th>Size</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {q.data.items.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.isPublic && m.mimeType.startsWith('image/') && (
                        <img
                          className="media-thumb"
                          src={`${api.defaults.baseURL}/media/${m.id}`}
                          alt={m.altText || m.originalFilename}
                          width="80"
                          height="60"
                          loading="lazy"
                        />
                      )}
                      {m.originalFilename}
                      <small>{m.altText}</small>
                    </td>
                    <td>{Math.ceil(m.fileSize / 1024)} KB</td>
                    <td>{m.isPublic ? 'Public' : 'Private'}</td>
                    <td>
                      <button className="text-button" onClick={() => setEditing(m)}>
                        {t('edit')}
                      </button>
                      <button className="text-button" onClick={() => void download(m.id)}>
                        Download
                      </button>
                      <button className="text-button" onClick={() => void remove(m.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} setPage={setPage} total={q.data.total} size={q.data.size} />
        </>
      )}
    </>
  );
}
function MediaEdit({ media, close }: { media: Media; close: () => void }) {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const [error, setError] = useState('');
  const schema = z.object({ altText: z.string().max(500), isPublic: z.boolean() });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { altText: media.altText, isPublic: media.isPublic },
  });
  return (
    <form
      className="panel"
      onSubmit={form.handleSubmit(async (values) => {
        setError('');
        try {
          await api.patch(`/admin/media/${media.id}`, values);
          await client.invalidateQueries({ queryKey: ['admin'] });
          close();
        } catch (e) {
          setError(errorMessage(e));
        }
      })}
    >
      <h2>{media.originalFilename}</h2>
      <Field id="edit-media-alt" label="Alt text" error={form.formState.errors.altText?.message}>
        <input id="edit-media-alt" {...form.register('altText')} />
      </Field>
      <label className="check-field">
        <input type="checkbox" {...form.register('isPublic')} />
        {i18n.language === 'vi' ? 'Công khai' : 'Public'}
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button" disabled={form.formState.isSubmitting}>
        {t('save')}
      </button>
      <button type="button" className="text-button" onClick={close}>
        {t('cancel')}
      </button>
    </form>
  );
}
type Raw = Record<string, unknown>;
export function Records({ resource }: { resource: 'users' | 'contact-messages' | 'audit-logs' }) {
  const { t } = useTranslation();
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
    if (!window.confirm(`Confirm ${path}: ${value}?`)) return;
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
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const resetMfa = async (id: string) => {
    if (!window.confirm('Reset MFA and revoke all sessions for this account?')) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/admin/users/${id}/reset-mfa`);
      await client.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const columns =
    resource === 'users'
      ? ['name', 'email', 'status', 'roles']
      : resource === 'contact-messages'
        ? ['full_name', 'email', 'subject', 'status']
        : ['timestamp', 'action', 'entity_type', 'entity_id'];
  return (
    <>
      <div className="admin-page-head">
        <h1>{resource.replaceAll('-', ' ')}</h1>
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
                    <th key={c}>{c}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {q.data.items.map((row) => (
                  <tr key={String(row.id)}>
                    {columns.map((c) => (
                      <td key={c}>
                        {Array.isArray(row[c]) ? row[c].join(', ') : String(row[c] || '—')}
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
                            {row.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>
                          {auth.user?.roles.includes('SUPER_ADMIN') &&
                            String(row.id) !== auth.user.id && (
                              <button
                                disabled={busy}
                                className="text-button"
                                onClick={() => void resetMfa(String(row.id))}
                              >
                                Reset MFA
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
export function Settings() {
  const q = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get<Record<string, string>>('/admin/settings')).data,
  });
  return (
    <>
      <div className="admin-page-head">
        <h1>Settings</h1>
      </div>
      {q.isPending || q.isError ? (
        <State loading={q.isPending} error={q.isError} retry={() => void q.refetch()} />
      ) : (
        <SettingsForm data={q.data || {}} />
      )}
    </>
  );
}
function SettingsForm({ data }: { data: Record<string, string> }) {
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const client = useQueryClient();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const url = z.union([
    z.literal(''),
    z
      .string()
      .url()
      .refine((value) => {
        const parsed = new URL(value);
        return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
      }, 'Use HTTPS URLs.'),
  ]);
  const schema = z.object({
    companyName: z.string().max(200),
    contactEmail: z.union([z.literal(''), z.string().email().max(254)]),
    contactPhone: z.string().max(40),
    contactAddress: z.string().max(1000),
    officeHours: z.string().max(200),
    facebookUrl: url,
    linkedinUrl: url,
  });
  const keys = [
    'companyName',
    'contactEmail',
    'contactPhone',
    'contactAddress',
    'officeHours',
    'facebookUrl',
    'linkedinUrl',
  ] as const;
  const labels = vi
    ? [
        'Tên doanh nghiệp',
        'Email liên hệ',
        'Điện thoại',
        'Địa chỉ',
        'Giờ làm việc',
        'Facebook',
        'LinkedIn',
      ]
    : ['Company name', 'Contact email', 'Phone', 'Address', 'Office hours', 'Facebook', 'LinkedIn'];
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(keys.map((key) => [key, data[key] || ''])),
  });
  return (
    <form
      className="panel"
      onSubmit={form.handleSubmit(async (values) => {
        setError('');
        setSaved(false);
        try {
          await api.put('/admin/settings', values);
          await client.invalidateQueries({ queryKey: ['site'] });
          setSaved(true);
        } catch (e) {
          setError(errorMessage(e));
        }
      })}
    >
      {keys.map((key, index) => (
        <Field key={key} id={key} label={labels[index]} error={form.formState.errors[key]?.message}>
          <input id={key} {...form.register(key)} aria-describedby={`${key}-error`} />
        </Field>
      ))}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="success" role="status">
          {t('sent')}
        </p>
      )}
      <button className="button" disabled={form.formState.isSubmitting}>
        {t('save')}
      </button>
    </form>
  );
}
export function Roles() {
  const q = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => (await api.get<string[]>('/admin/roles')).data,
  });
  return (
    <>
      <div className="admin-page-head">
        <h1>Roles</h1>
      </div>
      <p className="notice">
        Role changes are managed under Users. SUPER_ADMIN + MFA + recent authentication required.
        The last active SUPER_ADMIN cannot be demoted or disabled.
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
