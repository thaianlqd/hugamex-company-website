import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider';
import { api, errorMessage } from '../../services/api';
import Field from '../../components/common/Field';
export default function MfaGate() {
  const auth = useAuth();
  const { t, i18n } = useTranslation();
  const [secret, setSecret] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const action = async (path: string) => {
    setError('');
    setPending(true);
    try {
      if (path === 'setup') {
        const { data } = await api.post<{ secret: string }>('/auth/mfa/setup');
        setSecret(data.secret);
      } else {
        const { data } = await api.post<{ recoveryCodes?: string[] }>(`/auth/mfa/${path}`, {
          code,
        });
        if (data.recoveryCodes) setCodes(data.recoveryCodes);
        else await auth.sync();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="auth-card">
      <div className="eyebrow">ADMIN / SECURITY</div>
      <h1>{i18n.language === 'vi' ? 'Xác thực hai bước' : 'Two-factor authentication'}</h1>
      <p className="notice">
        {i18n.language === 'vi'
          ? 'ADMIN và SUPER_ADMIN cần xác thực TOTP trước khi truy cập CMS.'
          : 'ADMIN and SUPER_ADMIN must complete TOTP before accessing the CMS.'}
      </p>
      {codes.length ? (
        <>
          <p>
            {i18n.language === 'vi'
              ? 'Lưu các mã khôi phục ở nơi an toàn. Mỗi mã chỉ dùng được một lần.'
              : 'Store these recovery codes safely. Each code works once.'}
          </p>
          <ul className="recovery-codes">
            {codes.map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
          <button className="button" onClick={() => void auth.sync()}>
            {i18n.language === 'vi' ? 'Đã lưu mã · Tiếp tục' : 'Saved codes · Continue'}
          </button>
        </>
      ) : (
        <>
          {!auth.user?.mfaEnabled && !secret && (
            <button className="button" disabled={pending} onClick={() => void action('setup')}>
              {i18n.language === 'vi' ? 'Thiết lập ứng dụng xác thực' : 'Set up authenticator'}
            </button>
          )}
          {secret && (
            <div className="notice">
              <p>
                {i18n.language === 'vi'
                  ? 'Nhập khóa này vào ứng dụng Authenticator (TOTP, 6 số, 30 giây):'
                  : 'Enter this key into an Authenticator app (TOTP, 6 digits, 30 seconds):'}
              </p>
              <code className="mfa-secret">{secret}</code>
            </div>
          )}
          {(secret || auth.user?.mfaEnabled) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action(secret ? 'enable' : recovery ? 'recovery' : 'verify');
              }}
            >
              <Field id="mfaCode" label={recovery ? 'Recovery code' : t('otp')}>
                <input
                  id="mfaCode"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="one-time-code"
                  inputMode={recovery ? 'text' : 'numeric'}
                  required
                  maxLength={100}
                />
              </Field>
              <button className="button" disabled={pending}>
                {t('verifyMfa')}
              </button>
              {!secret && (
                <button type="button" className="arrow-link" onClick={() => setRecovery(!recovery)}>
                  {recovery ? 'TOTP' : 'Recovery code'}
                </button>
              )}
            </form>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        className="arrow-link"
        onClick={() => void auth.logout().catch((e) => setError(errorMessage(e)))}
      >
        {t('logout')}
      </button>
    </div>
  );
}
