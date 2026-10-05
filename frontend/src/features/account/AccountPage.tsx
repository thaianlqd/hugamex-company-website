import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../../services/api';
import { Seo, State } from '../../components/common/Shared';
import RecoveryCodes from './RecoveryCodes';
import MfaGate from '../auth/MfaGate';
import Field from '../../components/common/Field';
export default function AccountPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation();
  const [error, setError] = useState('');
  const [securityOpen, setSecurityOpen] = useState(false);
  const schema = z.object({
    currentPassword: z.string().min(1, t('required')).max(128),
    password: z.string().min(12, t('required')).max(128),
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  if (auth.pending) return <State loading />;
  if (!auth.user) return <Navigate to="/dang-nhap" replace />;
  const admin = auth.user.roles.some((r) => ['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(r));
  if (securityOpen && (!auth.user.mfaEnabled || !auth.user.mfaVerified)) return <MfaGate />;
  return (
    <div className="auth-card">
      <Seo title={t('account')} path="/tai-khoan" />
      <h1>{t('account')}</h1>
      <p>{auth.user.name}</p>
      <p>{auth.user.email}</p>
      {admin && (
        <Link className="button" to="/admin" style={{ marginTop: 25 }}>
          CMS / Admin
        </Link>
      )}
      <button
        className="arrow-link"
        style={{ display: 'flex', marginBottom: 40 }}
        onClick={() => void auth.logout().catch((e) => setError(errorMessage(e)))}
      >
        {t('logout')}
      </button>
      <h2 style={{ fontSize: 25, marginBottom: 25 }}>
        {i18n.language === 'vi' ? 'Đổi mật khẩu' : 'Change password'}
      </h2>
      <form
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setError('');
          try {
            await api.post('/account/change-password', values);
            await auth.logout();
          } catch (e) {
            setError(errorMessage(e));
          }
        })}
      >
        {(['currentPassword', 'password'] as const).map((key, i) => (
          <Field
            key={key}
            id={key}
            label={
              i18n.language === 'vi'
                ? i === 0
                  ? 'Mật khẩu hiện tại'
                  : 'Mật khẩu mới'
                : i === 0
                  ? 'Current password'
                  : 'New password'
            }
            error={form.formState.errors[key]?.message}
          >
            <input
              id={key}
              type="password"
              autoComplete={i === 0 ? 'current-password' : 'new-password'}
              {...form.register(key)}
              aria-describedby={`${key}-error`}
            />
          </Field>
        ))}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={form.formState.isSubmitting}>
          {t('save')}
        </button>
      </form>
      {admin &&
        (auth.user.mfaEnabled && auth.user.mfaVerified ? (
          <RecoveryCodes />
        ) : (
          <button className="arrow-link" onClick={() => setSecurityOpen(true)}>
            {i18n.language === 'vi' ? 'Thiết lập / xác thực MFA' : 'Set up / verify MFA'}
          </button>
        ))}
    </div>
  );
}
