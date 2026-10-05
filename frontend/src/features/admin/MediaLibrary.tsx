import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, errorMessage } from '../../services/api';
import { State } from '../../components/common/Shared';
import Field from '../../components/common/Field';
import type { PageResult } from '../../types';
import Pagination from './AdminPagination';
import MediaPreview from './MediaPreview';
import { FileText } from 'lucide-react';
import { useAdminDialog, useAdminToast } from '../../components/admin/useAdminFeedback';
type Media = {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  altText: string;
  isPublic: boolean;
};
export default function MediaLibrary() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const { toast, toastNode } = useAdminToast();
  const { confirm, dialogNode } = useAdminDialog();
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
      toast(i18n.language === 'vi' ? 'Đã tải tệp lên.' : 'File uploaded.');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media-picker'] });
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
    await confirm(
      i18n.language === 'vi'
        ? 'Xóa tệp này? Tệp đang được sử dụng sẽ được bảo vệ.'
        : 'Delete this file? Referenced files are protected.',
      async () => {
        try {
          await api.delete(`/admin/media/${id}`);
          toast(i18n.language === 'vi' ? 'Đã xóa tệp.' : 'File deleted.');
          await queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
        } catch (e) {
          setError(errorMessage(e));
        }
      },
    );
  };
  return (
    <>
      {toastNode}
      {dialogNode}
      <div className="admin-page-head">
        <h1>{i18n.language === 'vi' ? 'Thư viện media' : 'Media library'}</h1>
      </div>
      <details className="panel media-upload">
        <summary>{i18n.language === 'vi' ? 'Tải tệp mới lên' : 'Upload a file'}</summary>
        <form onSubmit={upload}>
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
            {busy ? t('loading') : i18n.language === 'vi' ? 'Tải lên' : 'Upload'}
          </button>
        </form>
      </details>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {editing && (
        <MediaEdit
          key={editing.id}
          media={editing}
          close={() => setEditing(null)}
          onSaved={() =>
            toast(i18n.language === 'vi' ? 'Đã lưu thông tin tệp.' : 'Media details saved.')
          }
        />
      )}
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
          <div className="media-grid">
            {q.data.items.map((m) => (
              <article className="media-card" key={m.id}>
                <div className="media-card-preview">
                  {m.mimeType.startsWith('image/') ? (
                    <MediaPreview id={m.id} alt={m.altText || m.originalFilename} />
                  ) : (
                    <FileText size={44} />
                  )}
                </div>
                <div className="media-card-body">
                  <h2>{m.originalFilename}</h2>
                  <div className="media-card-meta">
                    <span>{Math.ceil(m.fileSize / 1024)} KB</span>
                    <span>
                      {m.isPublic
                        ? i18n.language === 'vi'
                          ? 'Công khai'
                          : 'Public'
                        : i18n.language === 'vi'
                          ? 'Riêng tư'
                          : 'Private'}
                    </span>
                  </div>
                  <p>
                    {m.altText ||
                      (i18n.language === 'vi' ? 'Chưa có mô tả ảnh' : 'No image description')}
                  </p>
                  <div className="media-card-actions">
                    <button className="text-button" onClick={() => setEditing(m)}>
                      {t('edit')}
                    </button>
                    <button className="text-button" onClick={() => void download(m.id)}>
                      {i18n.language === 'vi' ? 'Tải xuống' : 'Download'}
                    </button>
                    <button className="text-button" onClick={() => void remove(m.id)}>
                      {i18n.language === 'vi' ? 'Xóa' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} setPage={setPage} total={q.data.total} size={q.data.size} />
        </>
      )}
    </>
  );
}
function MediaEdit({
  media,
  close,
  onSaved,
}: {
  media: Media;
  close: () => void;
  onSaved: () => void;
}) {
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
          await client.invalidateQueries({ queryKey: ['admin', 'media'] });
          onSaved();
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
