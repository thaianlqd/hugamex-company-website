import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import { appSurface, portalUrl, type Surface } from '../portals';
const AdminAuthLayout = lazy(() => import('../layouts/AdminAuthLayout'));
import { Seo, State } from '../../components/common/Shared';
const PublicLayout = lazy(() => import('../../app/layouts/PublicLayout'));
const Home = lazy(() => import('../../pages/Home'));
const PublicContent = lazy(() => import('../../pages/PublicContent'));
const AuthPage = lazy(() => import('../../features/auth/AuthPage'));
const AccountPage = lazy(() => import('../../features/account/AccountPage'));
const AccountLayout = lazy(() => import('../../features/account/AccountLayout'));
const AccountPortalLayout = lazy(() =>
  import('../../features/account/AccountLayout').then((m) => ({ default: m.AccountPortalLayout })),
);
const ChangePasswordPage = lazy(() => import('../../features/account/ChangePasswordPage'));
const AccountSecurityPage = lazy(() => import('../../features/account/AccountSecurityPage'));
const ContactPage = lazy(() => import('../../features/contact/ContactPage'));
const AdminLayout = lazy(() => import('../../features/admin/AdminLayout'));
const AdminContentWorkspace = lazy(() => import('../../features/admin/AdminContentWorkspace'));
const Dashboard = lazy(() => import('../../features/admin/Dashboard'));
const MediaLibrary = lazy(() => import('../../features/admin/MediaLibrary'));
const Records = lazy(() =>
  import('../../features/admin/AdminManagement').then((m) => ({ default: m.Records })),
);
const Roles = lazy(() =>
  import('../../features/admin/AdminManagement').then((m) => ({ default: m.Roles })),
);
const publicPaths = [
  'gioi-thieu',
  'gioi-thieu/lich-su',
  'gioi-thieu/tam-nhin-su-menh',
  'nang-luc-san-xuat',
  'san-pham',
  'he-thong',
  'doi-tac',
  'chung-nhan',
  'phat-trien-ben-vung',
  'tin-tuc',
  'tuyen-dung',
  'chinh-sach-bao-mat',
  'he-thong/:slug',
  'tin-tuc/:slug',
  'san-pham/:slug',
  'doi-tac/:slug',
  'chung-nhan/:slug',
];
function PortalRedirect({ surface }: { surface: Surface }) {
  const { pathname, search, hash } = useLocation();
  const url = portalUrl(surface, pathname + search + hash);
  useEffect(() => {
    if (url) window.location.replace(url);
  }, [url]);
  return url ? <State loading /> : <NotFound />;
}
function NotFound() {
  return (
    <div className="page-body">
      <Seo title="404" path="/404" noIndex />
      <h1>404</h1>
      <p>Trang không tồn tại / Page not found</p>
      <Link className="arrow-link" to="/">
        HUGAMEX / Home
      </Link>
    </div>
  );
}
export default function AppRoutes({ surface = appSurface }: { surface?: Surface }) {
  const admin = surface === 'admin';
  return (
    <Suspense fallback={<State loading />}>
      <Routes>
        <Route element={admin ? <AdminAuthLayout /> : <PublicLayout />}>
          <Route index element={admin ? <Navigate to="/admin" replace /> : <Home />} />
          {!admin && (
            <>
              {publicPaths.map((p) => (
                <Route key={p} path={p} element={<PublicContent />} />
              ))}
              <Route path="lien-he" element={<ContactPage />} />
            </>
          )}
          {admin && <Route path="dang-ky" element={<PortalRedirect surface="public" />} />}
          {[
            'dang-nhap',
            ...(!admin ? ['dang-ky'] : []),
            'xac-thuc-email',
            'quen-mat-khau',
            'dat-lai-mat-khau',
          ].map((p) => (
            <Route key={p} path={p} element={<AuthPage />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={admin ? <AccountPortalLayout /> : <PublicLayout />}>
          <Route path="tai-khoan" element={<AccountLayout />}>
            <Route index element={<AccountPage />} />
            <Route path="doi-mat-khau" element={<ChangePasswordPage />} />
            <Route path="bao-mat" element={<AccountSecurityPage />} />
          </Route>
        </Route>
        {!admin && <Route path="admin/*" element={<PortalRedirect surface="admin" />} />}
        {admin && (
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="contact-messages" element={<Records resource="contact-messages" />} />
            <Route path="users" element={<Records resource="users" />} />
            <Route path="audit-logs" element={<Records resource="audit-logs" />} />
            <Route path="roles" element={<Roles />} />
            <Route path=":resource" element={<AdminContentWorkspace />} />
            <Route path=":resource/:id" element={<AdminContentWorkspace />} />
          </Route>
        )}
      </Routes>
    </Suspense>
  );
}
