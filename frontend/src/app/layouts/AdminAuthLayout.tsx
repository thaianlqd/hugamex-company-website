import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { portalUrl } from '../portals';

export default function AdminAuthLayout() {
  const { i18n } = useTranslation();
  return (
    <>
      <a className="skip" href="#main">
        {i18n.language === 'vi' ? 'Đến nội dung' : 'Skip to content'}
      </a>
      <header className="site-header admin-auth-header">
        <Link className="wordmark" to="/admin">
          HUGAMEX<span>ADMIN / CMS</span>
        </Link>
        <div className="header-actions">
          <button
            className="language"
            aria-label="Change language"
            onClick={() => void i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
          >
            VI / EN
          </button>
          <a href={portalUrl('public') || '/'}>
            {i18n.language === 'vi' ? 'Trang khách hàng' : 'Public website'}
          </a>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
    </>
  );
}
