import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Seo, State } from '../../components/common/Shared';
import MfaGate from '../auth/MfaGate';
import { useTranslation } from 'react-i18next';
export const resources: Record<string, string> = {
  posts: 'Bài viết',
  categories: 'Danh mục',
  media: 'Thư viện media',
  pages: 'Trang nội dung',
  branches: 'Nhà máy / văn phòng',
  products: 'Sản phẩm',
  partners: 'Đối tác',
  certifications: 'Chứng nhận',
  'hero-slides': 'Hero',
  homepage: 'Trang chủ',
  'contact-messages': 'Liên hệ',
  users: 'Người dùng',
  roles: 'Phân quyền',
  'audit-logs': 'Nhật ký',
  settings: 'Cài đặt',
};
export default function AdminLayout() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  if (auth.pending) return <State loading />;
  if (!auth.user) return <Navigate to="/dang-nhap" replace />;
  const privileged = auth.user.roles.includes('ADMIN') || auth.user.roles.includes('SUPER_ADMIN');
  const superAdmin = auth.user.roles.includes('SUPER_ADMIN');
  const editorial = auth.user.roles.includes('EDITOR');
  if (!privileged && !editorial) return <Navigate to="/tai-khoan" replace />;
  if ((privileged || auth.user.mfaEnabled) && (!auth.user.mfaEnabled || !auth.user.mfaVerified))
    return <MfaGate />;
  const allowed = Object.entries(resources).filter(
    ([key]) =>
      superAdmin ||
      (privileged && !['roles', 'audit-logs', 'settings'].includes(key)) ||
      (editorial && ['posts', 'categories', 'media', 'pages'].includes(key)),
  );
  return (
    <div className="admin-shell">
      <Seo title="CMS" path="/admin" />
      <dialog
        id="admin-drawer"
        className="admin-drawer"
        ref={dialog}
        onCancel={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
      >
        <div className="admin-logo">
          <span className="wordmark">HUGAMEX</span>
          <button aria-label={t('close')} onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav aria-label="Admin mobile">
          <NavLink to="/admin" end onClick={() => setOpen(false)}>
            {i18n.language === 'vi' ? 'Tổng quan' : 'Overview'}
          </NavLink>
          {allowed.map(([key, label]) => (
            <NavLink key={key} to={`/admin/${key}`} onClick={() => setOpen(false)}>
              {i18n.language === 'vi' ? label : key.replaceAll('-', ' ')}
            </NavLink>
          ))}
        </nav>
      </dialog>
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <NavLink className="wordmark" to="/admin">
            HUGAMEX<span>CONTENT MANAGEMENT</span>
          </NavLink>
          <button className="mobile-only" aria-label={t('close')} onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav aria-label="Admin">
          <NavLink to="/admin" end onClick={() => setOpen(false)}>
            {i18n.language === 'vi' ? 'Tổng quan' : 'Overview'}
          </NavLink>
          {allowed.map(([key, label]) => (
            <NavLink key={key} to={`/admin/${key}`} onClick={() => setOpen(false)}>
              {i18n.language === 'vi' ? label : key.replaceAll('-', ' ')}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/" className="admin-public">
          {t('home')}
          <ArrowUpRight size={16} />
        </NavLink>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            ref={trigger}
            className="mobile-only"
            aria-controls="admin-drawer"
            aria-expanded={open}
            aria-label={t('menu')}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <span>CMS / {auth.user.name}</span>
          <div>
            <button onClick={() => void i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}>
              VI / EN
            </button>
            <NavLink to="/tai-khoan">{t('account')}</NavLink>
          </div>
        </header>
        <main id="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
