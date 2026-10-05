import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowUpRight, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Seo, State } from '../../components/common/Shared';
import LogoutButton from '../../components/common/LogoutButton';
import { portalUrl } from '../../app/portals';
export function AccountPortalLayout() {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  return (
    <div className="admin-account-root">
      <a className="skip" href="#main">
        {vi ? 'Đến nội dung' : 'Skip to content'}
      </a>
      <header className="account-portal-header">
        <Link className="wordmark" to="/admin">
          HUGAMEX<span>ADMIN / CMS</span>
        </Link>
        <nav aria-label={vi ? 'Điều hướng tài khoản' : 'Account navigation'}>
          <Link to="/admin">
            <ArrowLeft size={16} />
            {vi ? 'Về CMS' : 'Back to CMS'}
          </Link>
          <button
            aria-label={vi ? 'Đổi ngôn ngữ' : 'Change language'}
            onClick={() => void i18n.changeLanguage(vi ? 'en' : 'vi')}
          >
            {vi ? 'VI' : 'EN'}
          </button>
        </nav>
      </header>
      <main id="main">
        <Outlet />
      </main>
    </div>
  );
}
export default function AccountLayout() {
  const auth = useAuth();
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  if (auth.pending) return <State loading />;
  if (!auth.user) return <Navigate to="/dang-nhap" replace />;
  const admin = auth.user.roles.some((r) => ['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(r));
  return (
    <section className="account-workspace">
      <Seo title={t('account')} path="/tai-khoan" noIndex />
      <header className="account-heading">
        <div>
          <div className="eyebrow">HUGAMEX / {vi ? 'TÀI KHOẢN' : 'ACCOUNT'}</div>
          <h1>{vi ? 'Tài khoản của tôi' : 'My account'}</h1>
          <p>
            {vi
              ? 'Quản lý thông tin cá nhân và bảo mật đăng nhập.'
              : 'Manage your profile and sign-in security.'}
          </p>
        </div>
        <LogoutButton />
      </header>
      <div className="account-columns">
        <nav
          className="account-navigation"
          aria-label={vi ? 'Cài đặt tài khoản' : 'Account settings'}
        >
          <NavLink to="/tai-khoan" end>
            <UserRound size={18} />
            {vi ? 'Thông tin cá nhân' : 'Personal information'}
          </NavLink>
          <NavLink to="/tai-khoan/doi-mat-khau">
            <LockKeyhole size={18} />
            {vi ? 'Đổi mật khẩu' : 'Change password'}
          </NavLink>
          {admin && (
            <NavLink to="/tai-khoan/bao-mat">
              <ShieldCheck size={18} />
              {vi ? 'Bảo mật & MFA' : 'Security & MFA'}
            </NavLink>
          )}
          {admin ? (
            <Link className="account-cms-link" to="/admin">
              CMS / Admin
              <ArrowUpRight size={16} />
            </Link>
          ) : (
            <a href={portalUrl('public') || '/'}>
              {vi ? 'Về website' : 'Back to website'}
              <ArrowUpRight size={16} />
            </a>
          )}
        </nav>
        <div className="account-panel">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
