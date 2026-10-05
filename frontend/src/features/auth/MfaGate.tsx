import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider';
import { api, errorMessage } from '../../services/api';
import Field from '../../components/common/Field';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import LogoutButton from '../../components/common/LogoutButton';
export default function MfaGate({ embedded = false }: { embedded?: boolean }) {
  const auth = useAuth();
  const Heading = embedded ? 'h2' : 'h1';
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
    <section className={`mfa-card${embedded ? ' mfa-embedded' : ''}`}>
      <div className="mfa-heading">
        <span className="account-icon">
          <ShieldCheck size={24} />
        </span>
        <div className="eyebrow">HUGAMEX / SECURITY</div>
      </div>
      <Heading>
        {i18n.language === 'vi' ? 'Xác thực hai bước' : 'Two-factor authentication'}
      </Heading>
      <p className="notice">
        {i18n.language === 'vi'
          ? 'Nhập mã từ ứng dụng Authenticator để mở không gian quản trị của bạn.'
          : 'Enter a code from your Authenticator app to open your CMS workspace.'}
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
              <Field
                id="mfaCode"
                label={
                  recovery ? (i18n.language === 'vi' ? 'Mã khôi phục' : 'Recovery code') : t('otp')
                }
              >
                <input
                  id="mfaCode"
                  value={code}
                  onChange={(e) =>
                    setCode(
                      recovery ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6),
                    )
                  }
                  autoComplete="one-time-code"
                  inputMode={recovery ? 'text' : 'numeric'}
                  required
                  maxLength={recovery ? 100 : 6}
                  pattern={recovery ? undefined : '[0-9]{6}'}
                  className="mfa-code-input"
                />
              </Field>
              <div className="mfa-actions">
                <button className="button" disabled={pending}>
                  {t('verifyMfa')}
                </button>
                {!secret && (
                  <button
                    type="button"
                    className="arrow-link"
                    onClick={() => {
                      setRecovery(!recovery);
                      setCode('');
                      setError('');
                    }}
                  >
                    {recovery
                      ? i18n.language === 'vi'
                        ? 'Dùng mã ứng dụng'
                        : 'Use authenticator'
                      : i18n.language === 'vi'
                        ? 'Mã khôi phục'
                        : 'Recovery code'}
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!embedded && (
        <nav
          className="mfa-footer"
          aria-label={i18n.language === 'vi' ? 'Tài khoản và đăng xuất' : 'Account and sign out'}
        >
          <Link to="/tai-khoan">
            {i18n.language === 'vi' ? 'Thông tin tài khoản' : 'Account information'}
          </Link>
          <LogoutButton />
        </nav>
      )}
    </section>
  );
}
