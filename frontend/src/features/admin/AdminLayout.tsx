import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  ArrowUpRight,
  LayoutDashboard,
  FileText,
  Folder,
  Image,
  Building2,
  Package,
  Handshake,
  BadgeCheck,
  Mail,
  Users,
  ShieldCheck,
  History,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Seo, State } from '../../components/common/Shared';
import MfaGate from '../auth/MfaGate';
import LogoutButton from '../../components/common/LogoutButton';
import { useTranslation } from 'react-i18next';
import { portalUrl } from '../../app/portals';
export const resources: Record<string, string> = {
  posts: 'Bài viết',
  categories: 'Danh mục bài viết',
  'product-categories': 'Danh mục sản phẩm',
  media: 'Thư viện media',
  pages: 'Trang nội dung',
  branches: 'Hệ thống',
  products: 'Sản phẩm',
  partners: 'Khách hàng & đối tác',
  certifications: 'Chất lượng & giải thưởng',
  'contact-messages': 'Liên hệ',
  users: 'Người dùng',
  roles: 'Phân quyền',
  'audit-logs': 'Nhật ký',
};
const english: Record<string, string> = {
  posts: 'Articles',
  categories: 'Article categories',
  'product-categories': 'Product categories',
  media: 'Media library',
  pages: 'Pages',
  branches: 'Network',
  products: 'Products',
  partners: 'Customers & partners',
  certifications: 'Quality & awards',
  'contact-messages': 'Contact messages',
  users: 'Users',
  roles: 'Permissions',
  'audit-logs': 'Audit log',
};
const groups = [
  ['Nội dung', 'Content', ['posts', 'categories', 'pages', 'media']],
  [
    'Doanh nghiệp',
    'Company',
    ['products', 'product-categories', 'branches', 'partners', 'certifications'],
  ],
  ['Giao tiếp', 'Communication', ['contact-messages']],
  ['Quyền truy cập', 'Access', ['users', 'roles']],
  ['Hệ thống', 'System', ['audit-logs']],
] as const;
const icons = {
  posts: FileText,
  categories: Folder,
  'product-categories': Folder,
  media: Image,
  pages: FileText,
  products: Package,
  branches: Building2,
  partners: Handshake,
  certifications: BadgeCheck,
  'contact-messages': Mail,
  users: Users,
  roles: ShieldCheck,
  'audit-logs': History,
};
export default function AdminLayout() {
  const auth = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
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
    return (
      <div className="admin-auth-root admin-security">
        <Seo title="MFA" path="/admin" noIndex />
        <main id="main">
          <MfaGate />
        </main>
      </div>
    );
  const allowed = (key: string) =>
    superAdmin ||
    (privileged && !['roles', 'audit-logs', 'settings'].includes(key)) ||
    (editorial && ['posts', 'categories', 'media', 'pages'].includes(key));
  const current = location.pathname.split('/')[2];
  const title = current
    ? vi
      ? resources[current] || 'Tài khoản'
      : english[current] || 'Account'
    : vi
      ? 'Tổng quan'
      : 'Overview';
  const navigation = (
    <>
      <NavLink to="/admin" end onClick={() => setOpen(false)}>
        <LayoutDashboard size={18} />
        {vi ? 'Tổng quan' : 'Overview'}
      </NavLink>
      {groups.map(
        ([label, en, keys]) =>
          keys.some(allowed) && (
            <div className="admin-nav-group" key={en}>
              <span>{vi ? label : en}</span>
              {keys.filter(allowed).map((key) => {
                const Icon = icons[key];
                return (
                  <NavLink key={key} to={`/admin/${key}`} onClick={() => setOpen(false)}>
                    <Icon size={18} />
                    {vi ? resources[key] : english[key]}
                  </NavLink>
                );
              })}
            </div>
          ),
      )}
    </>
  );
  return (
    <div className="admin-shell">
      <Seo title="CMS" path="/admin" />
      <a className="skip" href="#admin-main">
        {vi ? 'Đến nội dung' : 'Skip to content'}
      </a>
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
        <nav aria-label={vi ? 'Quản trị' : 'Administration'}>{navigation}</nav>
      </dialog>
      <aside
        className="admin-sidebar"
        aria-label={vi ? 'Điều hướng quản trị' : 'Administration navigation'}
      >
        <div className="admin-logo">
          <NavLink className="wordmark" to="/admin">
            HUGAMEX<span>CONTENT MANAGEMENT</span>
          </NavLink>
        </div>
        <nav aria-label={vi ? 'Quản trị' : 'Administration'}>{navigation}</nav>
        <a href={portalUrl('public') || '/'} className="admin-public">
          {vi ? 'Trang khách hàng' : 'Public website'}
          <ArrowUpRight size={16} />
        </a>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
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
            <span className="admin-breadcrumb">
              CMS <span>/</span> {title}
            </span>
          </div>
          <div>
            <button onClick={() => void i18n.changeLanguage(vi ? 'en' : 'vi')}>
              {vi ? 'VI' : 'EN'}
            </button>
            <a
              className="admin-top-public"
              href={portalUrl('public') || '/'}
              aria-label={vi ? 'Trang khách hàng' : 'Public website'}
            >
              <ArrowUpRight size={18} />
            </a>
            <NavLink
              className="admin-avatar"
              to="/tai-khoan"
              aria-label={`${t('account')}: ${auth.user.name}`}
              title={auth.user.name}
            >
              {auth.user.name.slice(0, 1).toUpperCase()}
            </NavLink>
            <LogoutButton />
          </div>
        </header>
        <main id="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
