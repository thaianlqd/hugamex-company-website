import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { api, errorMessage } from '../../services/api';
import { RichText, State } from '../../components/common/Shared';
import Field from '../../components/common/Field';
import type { Content, PageResult, RichNode } from '../../types';
import { resources } from './AdminLayout';
import MediaPreview from './MediaPreview';
import Pagination from './AdminPagination';
import { useAdminDialog, useAdminToast } from '../../components/admin/useAdminFeedback';
import ContentImage, { validHeroImageUrl } from '../../components/common/ContentImage';
import { Bold, Italic, Heading2, Heading3, List, Undo2, Redo2 } from 'lucide-react';
export function AdminContentList() {
  const { resource = 'posts' } = useParams();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [locale, setLocale] = useState('vi');
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['admin', resource, locale, search, status, page],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>(`/admin/${resource}`, {
          params: { locale, search, status, page },
        })
      ).data,
  });
  return (
    <>
      <div className="admin-page-head">
        <div>
          <div className="breadcrumb">CMS / {resource}</div>
          <h1>{resources[resource] || resource}</h1>
        </div>
        <Link className="button" to={`/admin/${resource}/new`}>
          {t('create')}
        </Link>
      </div>
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
        <select
          aria-label={t('status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">{t('viewAll')}</option>
          {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((s) => (
            <option key={s} value={s}>
              {t(s.toLowerCase())}
            </option>
          ))}
        </select>
        <select
          aria-label="Language"
          value={locale}
          onChange={(e) => {
            setLocale(e.target.value);
            setPage(0);
          }}
        >
          <option>vi</option>
          <option>en</option>
        </select>
      </div>
      {query.isPending || query.isError ? (
        <State loading={query.isPending} error={query.isError} retry={() => void query.refetch()} />
      ) : !query.data?.items.length ? (
        <State />
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('title')}</th>
                  <th>{t('status')}</th>
                  <th>{t('slug')}</th>
                  <th>VI / EN</th>
                  <th>{t('publish')}</th>
                  <th>{t('edit')}</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-title">
                        {item.featuredMediaId && (
                          <div className="table-thumbnail">
                            <MediaPreview id={item.featuredMediaId} alt="" />
                          </div>
                        )}
                        <span>
                          {item.title}
                          {item.featured && <small>★</small>}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status ${item.status.toLowerCase()}`}>
                        {t(item.status.toLowerCase())}
                      </span>
                    </td>
                    <td>{item.slug}</td>
                    <td>{item.locale.toUpperCase()}</td>
                    <td>
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString(item.locale)
                        : '—'}
                    </td>
                    <td>
                      <Link
                        className="text-button"
                        to={`/admin/${resource}/${item.id}?locale=${locale}`}
                      >
                        {t('edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={query.data.total}
            size={query.data.size}
            setPage={setPage}
          />
        </>
      )}
    </>
  );
}
const schema = z.object({
  title: z.string().trim().min(1, 'Required').max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.')
    .max(180),
  excerpt: z.string().max(1000),
  seoTitle: z.string().max(200),
  seoDescription: z.string().max(320),
  featuredMediaId: z.string(),
  featured: z.boolean(),
  categoryIds: z.array(z.string()),
  metadata: z
    .record(z.string())
    .refine(
      (m) => !m.externalImageUrl || validHeroImageUrl(m.externalImageUrl),
      'HTTPS · images.pexels.com / images.unsplash.com',
    ),
});
type Values = z.infer<typeof schema>;
const empty: Values = {
  title: '',
  slug: '',
  excerpt: '',
  seoTitle: '',
  seoDescription: '',
  featuredMediaId: '',
  featured: false,
  categoryIds: [],
  metadata: {},
};
const metadataFields: Record<string, string[]> = {
  pages: ['routeKey'],
  branches: ['type', 'address', 'phone', 'email', 'hours', 'latitude', 'longitude', 'mapUrl'],
  products: ['specification'],
  partners: ['website', 'referenceYear', 'customerNames', 'composition'],
  certifications: ['issuer', 'validUntil', 'documentMediaId'],
  'hero-slides': ['link', 'externalImageUrl'],
};
export function AdminContentEditor({ onClose }: { onClose?: () => void } = {}) {
  const { resource = 'posts', id = 'new' } = useParams();
  const { t, i18n } = useTranslation();
  const initialLocale =
    new URLSearchParams(window.location.search).get('locale') === 'en' ? 'en' : 'vi';
  const [locale, setLocale] = useState(initialLocale);
  const [preview, setPreview] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [documentDirty, setDocumentDirty] = useState(false);
  const [error, setError] = useState('');
  const { toast, toastNode } = useAdminToast();
  const { confirm, dialogNode } = useAdminDialog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const dirty = form.formState.isDirty || documentDirty;
  const query = useQuery({
    queryKey: ['admin', resource, id, locale],
    queryFn: async () =>
      (await api.get<Content>(`/admin/${resource}/${id}`, { params: { locale } })).data,
    enabled: id !== 'new',
    retry: false,
  });
  const media = useQuery({
    queryKey: ['admin', 'media-picker', mediaSearch],
    queryFn: async () =>
      (
        await api.get<
          PageResult<{ id: string; originalFilename: string; isPublic: boolean; mimeType: string }>
        >('/admin/media', { params: { size: 50, search: mediaSearch } })
      ).data,
  });
  const categories = useQuery({
    queryKey: ['admin', 'category-picker', resource, locale],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>(
          resource === 'products' ? '/admin/product-categories' : '/admin/categories',
          { params: { size: 50, locale } },
        )
      ).data,
    enabled: ['posts', 'products'].includes(resource),
  });
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, underline: false }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: () => setDocumentDirty(true),
    editorProps: {
      attributes: { role: 'textbox', 'aria-label': 'Content editor', 'aria-multiline': 'true' },
    },
  });
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const d = query.data;
    form.reset(
      d
        ? {
            title: d.title,
            slug: d.slug,
            excerpt: d.excerpt,
            seoTitle: d.seoTitle,
            seoDescription: d.seoDescription,
            featuredMediaId: d.featuredMediaId || '',
            featured: d.featured,
            categoryIds: d.categoryIds,
            metadata: d.metadata,
          }
        : empty,
    );
    editor?.commands.setContent(d?.content || { type: 'doc', content: [{ type: 'paragraph' }] }, {
      emitUpdate: false,
    });
    setDocumentDirty(false);
  }, [query.data, locale, id, form, editor]);
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    await queryClient.invalidateQueries({ queryKey: ['public'] });
    await queryClient.invalidateQueries({ queryKey: ['site'] });
    await queryClient.invalidateQueries({ queryKey: ['home-news'] });
  };
  const save = useMutation({
    mutationFn: async (values: Values) => {
      if (!editor || editor.isDestroyed) throw new Error('Editor unavailable');
      const body = {
        ...values,
        locale,
        featuredMediaId: values.featuredMediaId || null,
        content: editor.getJSON(),
      };
      return id === 'new'
        ? (await api.post<Content>(`/admin/${resource}`, body)).data
        : (await api.put<Content>(`/admin/${resource}/${id}`, body)).data;
    },
    onSuccess: async (data) => {
      toast(i18n.language === 'vi' ? 'Đã lưu nội dung.' : 'Content saved.');
      setError('');
      await invalidate();
      if (id === 'new') navigate(`/admin/${resource}/${data.id}?locale=${locale}`);
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const changeStatus = async (status: string) => {
    if (dirty) {
      setError(
        i18n.language === 'vi'
          ? 'Lưu nội dung trước khi đổi trạng thái.'
          : 'Save changes before changing status.',
      );
      return;
    }
    const update = async () => {
      try {
        await api.patch(`/admin/${resource}/${id}/status`, { status });
        await invalidate();
        toast(i18n.language === 'vi' ? 'Đã cập nhật trạng thái.' : 'Status updated.');
        setError('');
      } catch (e) {
        setError(errorMessage(e));
      }
    };
    if (status === 'ARCHIVED')
      await confirm(
        i18n.language === 'vi'
          ? 'Lưu trữ nội dung này? Nội dung sẽ không còn hiển thị công khai.'
          : 'Archive this content? It will no longer be visible on the website.',
        update,
      );
    else await update();
  };
  const values = form.watch();
  return (
    <>
      {toastNode}
      {dialogNode}
      <div className="admin-page-head">
        <div>
          <div className="breadcrumb">
            <Link to={`/admin/${resource}`}>{resources[resource] || resource}</Link> /{' '}
            {t(id === 'new' ? 'create' : 'edit')}
          </div>
          <h2 id="content-modal-title">
            {t(id === 'new' ? 'create' : 'edit')} · {resources[resource] || resource}
          </h2>
        </div>
        <div className="toolbar">
          <select
            aria-label="Translation language"
            value={locale}
            onChange={(e) => {
              const next = e.target.value;
              if (!dirty) setLocale(next);
              else
                void confirm(
                  i18n.language === 'vi'
                    ? 'Bỏ các thay đổi chưa lưu để đổi ngôn ngữ?'
                    : 'Discard unsaved changes and switch language?',
                ).then((yes) => {
                  if (yes) setLocale(next);
                });
            }}
          >
            <option>vi</option>
            <option>en</option>
          </select>
          <button className="button secondary" onClick={() => setPreview(!preview)}>
            {t('preview')}
          </button>
          {onClose && (
            <button
              type="button"
              className="content-modal-close"
              data-editor-close
              aria-label={i18n.language === 'vi' ? 'Đóng trình soạn thảo' : 'Close editor'}
              disabled={save.isPending}
              onClick={() => {
                if (dirty)
                  void confirm(
                    i18n.language === 'vi'
                      ? 'Bỏ thay đổi chưa lưu và đóng?'
                      : 'Discard unsaved changes and close?',
                  ).then((yes) => {
                    if (yes) onClose();
                  });
                else onClose();
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      {query.isPending && id !== 'new' ? (
        <State loading />
      ) : (
        <>
          {query.isError && (
            <div className="notice">
              {i18n.language === 'vi'
                ? 'Không tải được bản dịch. Nếu ngôn ngữ này chưa có, điền nội dung rồi lưu để tạo bản dịch.'
                : 'Translation unavailable. If this language is missing, add its content and save.'}
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {preview ? (
            <article className="prose preview">
              <span className="status draft">PREVIEW / {locale.toUpperCase()}</span>
              <h1>{values.title}</h1>
              <p>{values.excerpt}</p>
              {values.featuredMediaId && (
                <MediaPreview
                  key={values.featuredMediaId}
                  id={values.featuredMediaId}
                  alt={query.data?.featuredMediaAlt || values.title}
                />
              )}
              {editor && <RichText node={editor.getJSON() as RichNode} />}
            </article>
          ) : (
            <form
              className="cms-form"
              noValidate
              onSubmit={form.handleSubmit((v) => save.mutate(v))}
            >
              <div className="cms-editor-layout">
                <div className="cms-editor-main">
                  <div className="form-grid">
                    {(['title', 'slug', 'excerpt'] as const).map((key) => (
                      <Field
                        key={key}
                        id={key}
                        label={t(key)}
                        error={form.formState.errors[key]?.message}
                        className={key === 'excerpt' ? 'wide' : ''}
                      >
                        {key === 'excerpt' ? (
                          <textarea
                            id={key}
                            {...form.register(key)}
                            aria-describedby={`${key}-error`}
                          />
                        ) : (
                          <input
                            id={key}
                            {...form.register(key)}
                            aria-describedby={`${key}-error`}
                          />
                        )}
                      </Field>
                    ))}
                  </div>
                  <label id="content-label">
                    {i18n.language === 'vi' ? 'Nội dung' : 'Content'}
                  </label>
                  <div className="editor-toolbar">
                    {[
                      ['bold', Bold, () => editor?.chain().focus().toggleBold().run()],
                      ['italic', Italic, () => editor?.chain().focus().toggleItalic().run()],
                      [
                        'heading',
                        Heading2,
                        () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                      ],
                      [
                        'heading3',
                        Heading3,
                        () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                      ],
                      ['bulletList', List, () => editor?.chain().focus().toggleBulletList().run()],
                      ['undo', Undo2, () => editor?.chain().focus().undo().run()],
                      ['redo', Redo2, () => editor?.chain().focus().redo().run()],
                    ].map(([label, Icon, run]) => (
                      <button
                        key={String(label)}
                        type="button"
                        onClick={run as () => void}
                        aria-label={t(String(label))}
                        title={t(String(label))}
                        aria-pressed={editor?.isActive(String(label)) || false}
                      >
                        {(() => {
                          const ToolIcon = Icon as typeof Bold;
                          return <ToolIcon size={18} />;
                        })()}
                      </button>
                    ))}
                  </div>
                  <EditorContent editor={editor} className="tiptap-frame" />
                </div>
                <aside
                  className="cms-editor-side"
                  aria-label={i18n.language === 'vi' ? 'Thiết lập nội dung' : 'Content settings'}
                >
                  <h2>{i18n.language === 'vi' ? 'Thiết lập nội dung' : 'Content settings'}</h2>
                  <div className="form-grid">
                    {(['seoTitle', 'seoDescription'] as const).map((key) => (
                      <Field
                        key={key}
                        id={key}
                        label={t(key)}
                        error={form.formState.errors[key]?.message}
                      >
                        <input id={key} {...form.register(key)} />
                      </Field>
                    ))}
                    <Field id="featuredMediaId" label="Media" className="wide">
                      <input
                        className="search"
                        aria-label={
                          i18n.language === 'vi' ? 'Tìm ảnh trong thư viện' : 'Search media library'
                        }
                        placeholder={t('search')}
                        value={mediaSearch}
                        onChange={(e) => setMediaSearch(e.target.value)}
                      />
                      <select id="featuredMediaId" {...form.register('featuredMediaId')}>
                        <option value="">—</option>
                        {values.featuredMediaId &&
                          !media.data?.items.some((item) => item.id === values.featuredMediaId) && (
                            <option value={values.featuredMediaId}>
                              {i18n.language === 'vi' ? 'Ảnh đang sử dụng' : 'Current image'}
                            </option>
                          )}
                        {media.data?.items
                          .filter((item) => item.mimeType.startsWith('image/'))
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.originalFilename} / {m.isPublic ? 'public' : 'private'}
                            </option>
                          ))}
                      </select>
                      {values.featuredMediaId && (
                        <MediaPreview
                          key={values.featuredMediaId}
                          id={values.featuredMediaId}
                          alt={values.title}
                        />
                      )}
                      <Link className="text-button" to="/admin/media" target="_blank">
                        {i18n.language === 'vi'
                          ? 'Mở thư viện để upload ảnh'
                          : 'Open library to upload media'}
                      </Link>
                    </Field>
                    {['posts', 'products'].includes(resource) && (
                      <Field
                        id="categoryIds"
                        label={i18n.language === 'vi' ? 'Danh mục' : 'Categories'}
                        className="wide"
                      >
                        <select multiple id="categoryIds" {...form.register('categoryIds')}>
                          {categories.data?.items.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {(metadataFields[resource] || []).map((key) => (
                      <Field
                        key={key}
                        id={`metadata-${key}`}
                        label={
                          key === 'externalImageUrl'
                            ? i18n.language === 'vi'
                              ? 'URL ảnh minh họa'
                              : 'Illustrative image URL'
                            : t(key)
                        }
                        error={form.formState.errors.metadata?.[key]?.message}
                      >
                        {key === 'routeKey' ? (
                          <select id={`metadata-${key}`} {...form.register(`metadata.${key}`)}>
                            <option value="">—</option>
                            {[
                              'gioi-thieu',
                              'lich-su',
                              'tam-nhin-su-menh',
                              'nang-luc-san-xuat',
                              'phat-trien-ben-vung',
                              'tuyen-dung',
                              'chinh-sach-bao-mat',
                            ].map((k) => (
                              <option key={k}>{k}</option>
                            ))}
                          </select>
                        ) : key === 'documentMediaId' ? (
                          <select id={`metadata-${key}`} {...form.register(`metadata.${key}`)}>
                            <option value="">—</option>
                            {media.data?.items
                              .filter((item) => item.mimeType === 'application/pdf')
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.originalFilename}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input
                            id={`metadata-${key}`}
                            type={key === 'validUntil' ? 'date' : 'text'}
                            {...form.register(`metadata.${key}`)}
                          />
                        )}
                        {key === 'externalImageUrl' && (
                          <>
                            <p className="field-help">
                              {i18n.language === 'vi'
                                ? 'HTTPS từ images.pexels.com hoặc images.unsplash.com. Ảnh thư viện được ưu tiên; URL dùng làm ảnh thay thế.'
                                : 'HTTPS from images.pexels.com or images.unsplash.com. Library images take priority.'}
                            </p>
                            {validHeroImageUrl(values.metadata.externalImageUrl || '') && (
                              <ContentImage
                                src={values.metadata.externalImageUrl}
                                alt=""
                                width={320}
                                height={180}
                              />
                            )}
                          </>
                        )}
                      </Field>
                    ))}
                  </div>
                  <label className="check-field">
                    <input type="checkbox" {...form.register('featured')} />
                    {i18n.language === 'vi' ? 'Nội dung nổi bật' : 'Featured content'}
                  </label>
                </aside>
              </div>
              <div className="form-actions">
                <button className="button" disabled={save.isPending}>
                  {save.isPending ? t('loading') : t('save')}
                </button>
                {id !== 'new' && (
                  <>
                    <span className={`status ${query.data?.status.toLowerCase()}`}>
                      {query.data?.status && t(query.data.status.toLowerCase())}
                    </span>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => void changeStatus('PUBLISHED')}
                    >
                      {t('publish')}
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => void changeStatus('DRAFT')}
                    >
                      {t('draft')}
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => void changeStatus('ARCHIVED')}
                    >
                      {t('archive')}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </>
      )}
    </>
  );
}
