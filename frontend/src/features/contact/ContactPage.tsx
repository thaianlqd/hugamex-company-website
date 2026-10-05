import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api, csrf, errorMessage } from '../../services/api';
import { Seo } from '../../components/common/Shared';
import Field from '../../components/common/Field';
import type { Site } from '../../types';
export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const schema = z.object({
    fullName: z.string().trim().min(1, t('required')).max(120),
    company: z.string().max(200),
    email: z.string().email(t('required')).max(254),
    phone: z.string().max(40),
    subject: z.string().trim().min(1, t('required')).max(200),
    message: z.string().trim().min(1, t('required')).max(5000),
    website: z.string().max(100),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      company: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      website: '',
    },
  });
  const site = useQuery({
    queryKey: ['site'],
    queryFn: async () => (await api.get<Site>('/public/site')).data,
  });
  const submit = form.handleSubmit(async (values) => {
    setError('');
    setSent(false);
    try {
      await api.post('/contact', values, { headers: await csrf() });
      setSent(true);
      form.reset();
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <>
      <Seo title={t('contact')} path="/lien-he" />
      <header className="page-header">
        <div className="eyebrow">HUGAMEX / CONTACT</div>
        <h1>
          {i18n.language === 'vi'
            ? 'Cùng trao đổi.\nCùng hợp tác.'
            : 'Let’s talk.\nLet’s collaborate.'}
        </h1>
      </header>
      <div className="page-body contact-layout">
        <div>
          <h2>{t('company')}</h2>
          <p>
            {site.data?.settings.contactAddress ||
              (i18n.language === 'vi'
                ? 'Thông tin liên hệ chính thức chờ xác nhận. Bạn có thể gửi yêu cầu qua biểu mẫu.'
                : 'Official contact details await confirmation. Send your enquiry using this form.')}
          </p>
          {site.data?.settings.contactEmail && <p>{site.data.settings.contactEmail}</p>}
          {site.data?.settings.contactPhone && <p>{site.data.settings.contactPhone}</p>}
          <p className="notice">
            {i18n.language === 'vi'
              ? 'Thông tin được lưu để bộ phận phụ trách phản hồi yêu cầu của bạn.'
              : 'Your information is stored so our team can respond to your enquiry.'}
          </p>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            {(
              [
                ['fullName', 'name'],
                ['company', 'business'],
                ['email', 'email'],
                ['phone', 'phone'],
                ['subject', 'subject'],
                ['message', 'message'],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                id={key}
                label={`${t(label)}${['fullName', 'email', 'subject', 'message'].includes(key) ? ' *' : ''}`}
                error={form.formState.errors[key]?.message}
                className={key === 'subject' || key === 'message' ? 'wide' : ''}
              >
                {key === 'message' ? (
                  <textarea
                    id={key}
                    {...form.register(key)}
                    aria-describedby={`${key}-error`}
                    aria-invalid={!!form.formState.errors[key]}
                  />
                ) : (
                  <input
                    id={key}
                    type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                    {...form.register(key)}
                    aria-describedby={`${key}-error`}
                    aria-invalid={!!form.formState.errors[key]}
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="honey" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" tabIndex={-1} autoComplete="off" {...form.register('website')} />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {sent && (
            <p className="success" role="status">
              {t('sent')}
            </p>
          )}
          <button
            className="button"
            style={{ marginTop: 25 }}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? t('loading') : t('send')}
          </button>
          <LinkPrivacy />
        </form>
      </div>
    </>
  );
}
function LinkPrivacy() {
  const { t } = useTranslation();
  return (
    <a href="/chinh-sach-bao-mat" style={{ display: 'block', marginTop: 18, fontSize: 11 }}>
      {t('privacy')}
    </a>
  );
}
