import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, errorMessage } from '../../services/api';

export default function RecoveryCodes() {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const regenerate = async () => {
    if (
      !window.confirm(
        vi
          ? 'Tạo bộ mã mới sẽ vô hiệu hóa tất cả mã khôi phục cũ. Tiếp tục?'
          : 'Generating new codes invalidates every previous recovery code. Continue?',
      )
    )
      return;
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post<{ recoveryCodes: string[] }>('/auth/mfa/recovery/regenerate');
      setCodes(data.recoveryCodes);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="account-security">
      <h2>{vi ? 'Mã khôi phục MFA' : 'MFA recovery codes'}</h2>
      <p>
        {vi
          ? 'Mỗi mã dùng một lần. Bạn cần đăng nhập gần đây và đã xác thực MFA để tạo bộ mã mới.'
          : 'Each code works once. Recent sign-in and completed MFA are required to generate new codes.'}
      </p>
      {codes.length ? (
        <>
          <p className="notice">
            {vi
              ? 'Lưu ngay vào nơi an toàn. Mã chỉ hiển thị trong phiên này.'
              : 'Store these safely now. The codes are only shown in this session.'}
          </p>
          <ul className="recovery-codes">
            {codes.map((code) => (
              <li key={code}>
                <code>{code}</code>
              </li>
            ))}
          </ul>
          <button className="button" onClick={() => setCodes([])}>
            {vi ? 'Đã lưu · Ẩn mã' : 'Saved · Hide codes'}
          </button>
        </>
      ) : (
        <button className="button secondary" disabled={busy} onClick={() => void regenerate()}>
          {vi ? 'Tạo bộ mã khôi phục mới' : 'Generate new recovery codes'}
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
