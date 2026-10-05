import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import MfaGate from '../auth/MfaGate';
import RecoveryCodes from './RecoveryCodes';
export default function AccountSecurityPage() {
  const auth = useAuth();
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  if (!auth.user?.roles.some((r) => ['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(r)))
    return <Navigate to="/tai-khoan" replace />;
  if (!auth.user.mfaEnabled || !auth.user.mfaVerified) return <MfaGate embedded />;
  return (
    <>
      <div className="account-panel-heading">
        <span className="account-icon">
          <ShieldCheck size={22} />
        </span>
        <div>
          <h2>{vi ? 'Bảo mật & MFA' : 'Security & MFA'}</h2>
          <p>
            {vi
              ? 'Xác thực hai bước đang bật cho tài khoản của bạn.'
              : 'Two-factor authentication is enabled for your account.'}
          </p>
        </div>
      </div>
      <p className="security-enabled">
        <ShieldCheck size={18} />
        {vi ? 'Đã xác thực trong phiên này' : 'Verified for this session'}
      </p>
      <RecoveryCodes />
    </>
  );
}
