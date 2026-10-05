import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthProvider';
import { errorMessage } from '../../services/api';
export default function LogoutButton({ className = '' }: { className?: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="logout-control">
      <button
        type="button"
        className={`logout-button ${className}`}
        disabled={busy}
        aria-label={t('logout')}
        onClick={() => {
          setBusy(true);
          setError('');
          void auth
            .logout()
            .then(() => navigate('/dang-nhap', { replace: true }))
            .catch((e) => setError(errorMessage(e)))
            .finally(() => setBusy(false));
        }}
      >
        <LogOut size={17} />
        <span>{busy ? t('loading') : t('logout')}</span>
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
