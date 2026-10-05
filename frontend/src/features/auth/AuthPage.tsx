import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthProvider';
import { api, csrf, errorMessage } from '../../services/api';
import { Seo } from '../../components/common/Shared';
import Field from '../../components/common/Field';
import { appSurface } from '../../app/portals';
export default function AuthPage() {
  const location = useLocation();
  return location.pathname === '/xac-thuc-email' || location.pathname === '/dat-lai-mat-khau' ? (
    <OtpPage />
  ) : (
    <CredentialsPage />
  );
}
function CredentialsPage() {
  const { t, i18n } = useTranslation();
  const { pathname, search } = useLocation();
  const register = pathname === '/dang-ky';
  const forgot = pathname === '/quen-mat-khau';
  const title = t(register ? 'register' : forgot ? 'forgot' : 'login');
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const schema = z.object({
    email: z.string().email(t('required')).max(254),
    password: forgot
      ? z.string()
      : z
          .string()
          .min(
            register ? 12 : 1,
            register
              ? i18n.language === 'vi'
                ? 'Mật khẩu cần ít nhất 12 ký tự.'
                : 'Use at least 12 characters.'
              : t('required'),
          )
          .max(128),
    name: register ? z.string().trim().min(1, t('required')).max(120) : z.string(),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '' },
  });
  const config = useQuery({
    queryKey: ['auth-config'],
    queryFn: async () => (await api.get<{ googleEnabled: boolean }>('/auth/config')).data,
  });
  const submit = form.handleSubmit(async (values) => {
    setError('');
    try {
      if (register || forgot) {
        const { data } = await api.post<{ challengeId: string }>(
          `/auth/${register ? 'register' : 'forgot-password'}`,
          register ? values : { email: values.email },
          { headers: await csrf() },
        );
        navigate(register ? '/xac-thuc-email' : '/dat-lai-mat-khau', {
          state: { challengeId: data.challengeId, email: values.email },
        });
      } else {
        await auth.login(values.email, values.password);
        navigate(appSurface === 'admin' ? '/admin' : '/tai-khoan');
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <div className="auth-card">
      <Seo title={title} path={pathname} />
      <div className="eyebrow">HUGAMEX / {appSurface === 'admin' ? 'ADMIN' : 'ACCOUNT'}</div>
      <h1>{title}</h1>
      {search.includes('oauth=') && (
        <p className="notice">
          {i18n.language === 'vi'
            ? 'Google chưa thể đăng nhập. Nếu email đã có tài khoản, hãy dùng phương thức đăng nhập hiện tại.'
            : 'Google sign-in failed. If this email already has an account, use its original sign-in method.'}
        </p>
      )}
      <form onSubmit={submit} noValidate>
        {register && (
          <Field id="name" label={t('name')} error={form.formState.errors.name?.message}>
            <input
              id="name"
              autoComplete="name"
              {...form.register('name')}
              aria-invalid={!!form.formState.errors.name}
              aria-describedby="name-error"
            />
          </Field>
        )}
        <Field id="email" label={t('email')} error={form.formState.errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register('email')}
            aria-invalid={!!form.formState.errors.email}
            aria-describedby="email-error"
          />
        </Field>
        {!forgot && (
          <Field
            id="password"
            label={t('password')}
            error={form.formState.errors.password?.message}
          >
            <input
              id="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              {...form.register('password')}
              aria-invalid={!!form.formState.errors.password}
              aria-describedby="password-error"
            />
          </Field>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('loading') : title}
        </button>
      </form>
      {!forgot && config.data?.googleEnabled && (
        <a
          className="button secondary"
          style={{ marginTop: 18 }}
          href="/oauth2/authorization/google"
        >
          Google
        </a>
      )}
      <div className="auth-links">
        <Link to="/dang-nhap">{t('login')}</Link>
        {appSurface !== 'admin' && <Link to="/dang-ky">{t('register')}</Link>}
        <Link to="/quen-mat-khau">{t('forgot')}</Link>
        <Link to="/xac-thuc-email">{t('verify')}</Link>
      </div>
    </div>
  );
}
function OtpPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const reset = location.pathname === '/dat-lai-mat-khau';
  const initial = location.state as { challengeId?: string; email?: string } | null;
  const auth = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState(initial?.email || '');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const schema = z.object({
    challengeId: z.string().uuid(t('required')),
    code: z.string().regex(/^\d{6}$/, t('required')),
    password: reset && auth.resetToken ? z.string().min(12, t('required')).max(128) : z.string(),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { challengeId: initial?.challengeId || '', code: '', password: '' },
  });
  const resend = async () => {
    setError('');
    setSending(true);
    try {
      const { data } = await api.post<{ challengeId: string }>(
        `/auth/${reset ? 'forgot-password' : 'resend-verification'}`,
        { email },
        { headers: await csrf() },
      );
      form.setValue('challengeId', data.challengeId);
      setCooldown(Date.now() + 60000);
      setSuccess(t('sent'));
      window.setTimeout(() => setCooldown(0), 60000);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };
  const submit = form.handleSubmit(async (values) => {
    setError('');
    try {
      if (reset && auth.resetToken) {
        await api.post(
          '/auth/reset-password',
          { resetToken: auth.resetToken, password: values.password },
          { headers: await csrf() },
        );
        auth.setResetToken('');
        navigate('/dang-nhap');
      } else {
        const { data } = await api.post<{ resetToken?: string }>(
          `/auth/${reset ? 'verify-reset-otp' : 'verify-email'}`,
          { challengeId: values.challengeId, code: values.code },
          { headers: await csrf() },
        );
        if (reset) auth.setResetToken(data.resetToken || '');
        else
          setSuccess(
            i18n.language === 'vi'
              ? 'Email đã xác thực. Bạn có thể đăng nhập.'
              : 'Email verified. You can sign in.',
          );
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <div className="auth-card">
      <Seo title={t(reset ? 'reset' : 'verify')} path={location.pathname} />
      <h1>{t(reset ? 'reset' : 'verify')}</h1>
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
      <form onSubmit={submit} noValidate>
        {!auth.resetToken && (
          <>
            <Field
              id="challengeId"
              label={t('challenge')}
              error={form.formState.errors.challengeId?.message}
            >
              <input
                id="challengeId"
                {...form.register('challengeId')}
                aria-describedby="challengeId-error"
              />
            </Field>
            <Field id="code" label={t('otp')} error={form.formState.errors.code?.message}>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                {...form.register('code')}
                aria-describedby="code-error"
              />
            </Field>
          </>
        )}
        {reset && auth.resetToken && (
          <Field
            id="newPassword"
            label={t('password')}
            error={form.formState.errors.password?.message}
          >
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
              aria-describedby="newPassword-error"
            />
          </Field>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={form.formState.isSubmitting}>
          {t('save')}
        </button>
      </form>
      {!auth.resetToken && (
        <div style={{ marginTop: 30 }}>
          <Field id="resendEmail" label={t('email')}>
            <input
              id="resendEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <button
            className="button secondary"
            onClick={() => void resend()}
            disabled={sending || cooldown > Date.now()}
          >
            {i18n.language === 'vi' ? 'Gửi lại mã · 60 giây' : 'Resend code · 60 seconds'}
          </button>
        </div>
      )}
      <div className="auth-links">
        <Link to="/dang-nhap">{t('login')}</Link>
      </div>
    </div>
  );
}
