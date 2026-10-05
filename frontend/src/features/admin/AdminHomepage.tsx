import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { api, errorMessage } from '../../services/api';
import { State } from '../../components/common/Shared';
import Field from '../../components/common/Field';
import type { Content, PageResult, Section } from '../../types';

const groups: Record<string, [string, string]> = {
  about: ['Giới thiệu', 'pages'],
  manufacturing: ['Năng lực sản xuất', 'pages'],
  products: ['Sản phẩm', 'products'],
  branches: ['Hệ thống', 'branches'],
  quality: ['Chất lượng', 'certifications'],
  partners: ['Đối tác', 'partners'],
  news: ['Tin tức', 'posts'],
};
const schema = z.object({
  enabled: z.boolean(),
  position: z.coerce.number().int().min(0).max(100),
  headlineVi: z.string().max(200),
  headlineEn: z.string().max(200),
  subheadlineVi: z.string().max(500),
  subheadlineEn: z.string().max(500),
  contentIds: z.array(z.string().uuid()).max(12),
});
export default function AdminHomepage() {
  const { i18n } = useTranslation();
  const query = useQuery({
    queryKey: ['admin', 'homepage'],
    queryFn: async () => (await api.get<Section[]>('/admin/homepage')).data,
  });
  return (
    <>
      <div className="admin-page-head">
        <h1>{i18n.language === 'vi' ? 'Trang chủ' : 'Homepage'}</h1>
      </div>
      <p className="notice">
        {i18n.language === 'vi'
          ? 'Bật hoặc tắt từng phần, đổi thứ tự và chọn nội dung đã xuất bản. Ảnh và tiêu đề mở đầu được quản lý trong Hero.'
          : 'Enable sections, change their order and choose published content. Manage the opening image and copy under Hero.'}
      </p>
      {query.isPending || query.isError ? (
        <State loading={query.isPending} error={query.isError} retry={() => void query.refetch()} />
      ) : (
        query.data?.map((section) => <SectionForm key={section.id} section={section} />)
      )}
    </>
  );
}
function SectionForm({ section }: { section: Section }) {
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [label, resource] = groups[section.key] || [section.key, 'pages'];
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      enabled: section.enabled,
      position: section.position,
      headlineVi: section.headlineVi,
      headlineEn: section.headlineEn,
      subheadlineVi: section.subheadlineVi,
      subheadlineEn: section.subheadlineEn,
      contentIds: section.contentIds,
    },
  });
  const selected = form.watch('contentIds');
  const choices = useQuery({
    queryKey: ['admin', 'homepage-picker', resource, search, page],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>(`/admin/${resource}`, {
          params: { locale: 'vi', status: 'PUBLISHED', search, page, size: 12 },
        })
      ).data,
  });
  const labels: Record<string, string> = {
    position: vi ? 'Thứ tự hiển thị' : 'Display order',
    headlineVi: 'Tiêu đề · VI',
    headlineEn: 'Headline · EN',
    subheadlineVi: 'Mô tả · VI',
    subheadlineEn: 'Description · EN',
  };
  return (
    <form
      className="panel"
      onSubmit={form.handleSubmit(async (values) => {
        setError('');
        setSaved(false);
        try {
          await api.put(`/admin/homepage/${section.id}`, {
            ...values,
            id: section.id,
            key: section.key,
          });
          await client.invalidateQueries({ queryKey: ['site'] });
          setSaved(true);
        } catch (e) {
          setError(errorMessage(e));
        }
      })}
    >
      <h2>{vi ? label : section.key}</h2>
      <div className="form-grid">
        {(['position', 'headlineVi', 'headlineEn', 'subheadlineVi', 'subheadlineEn'] as const).map(
          (key) => (
            <Field
              key={key}
              id={`${section.key}-${key}`}
              label={labels[key]}
              error={form.formState.errors[key]?.message}
            >
              <input
                id={`${section.key}-${key}`}
                type={key === 'position' ? 'number' : 'text'}
                {...form.register(key)}
              />
            </Field>
          ),
        )}
      </div>
      <label className="check-field">
        <input type="checkbox" {...form.register('enabled')} />
        {vi ? 'Hiển thị phần này' : 'Show this section'}
      </label>
      <fieldset className="content-picker">
        <legend>
          {vi
            ? `Nội dung hiển thị (${selected.length}/12)`
            : `Selected content (${selected.length}/12)`}
        </legend>
        <input
          className="search"
          aria-label={`${label}: ${t('search')}`}
          placeholder={t('search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        {choices.isPending || choices.isError ? (
          <State
            loading={choices.isPending}
            error={choices.isError}
            retry={() => void choices.refetch()}
          />
        ) : (
          choices.data?.items.map((item) => (
            <label className="check-field" key={item.id}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                disabled={!selected.includes(item.id) && selected.length >= 12}
                onChange={(e) =>
                  form.setValue(
                    'contentIds',
                    e.target.checked
                      ? [...selected, item.id]
                      : selected.filter((id) => id !== item.id),
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              />
              {item.title}
            </label>
          ))
        )}
        {choices.data && choices.data.total > 12 && (
          <div className="pagination">
            <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
              {t('previous')}
            </button>
            <span>{page + 1}</span>
            <button
              type="button"
              disabled={(page + 1) * 12 >= choices.data.total}
              onClick={() => setPage(page + 1)}
            >
              {t('next')}
            </button>
          </div>
        )}
        <button
          type="button"
          className="text-button"
          onClick={() => form.setValue('contentIds', [], { shouldDirty: true })}
        >
          {vi ? 'Bỏ chọn tất cả' : 'Clear selection'}
        </button>
        {form.formState.errors.contentIds && (
          <p role="alert" className="error">
            {form.formState.errors.contentIds.message}
          </p>
        )}
      </fieldset>
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
