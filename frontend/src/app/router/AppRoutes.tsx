import { lazy, Suspense } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { Seo, State } from '../../components/common/Shared';
const PublicLayout = lazy(() => import('../../app/layouts/PublicLayout'));
const Home = lazy(() => import('../../pages/Home'));
const PublicContent = lazy(() => import('../../pages/PublicContent'));
const AuthPage = lazy(() => import('../../features/auth/AuthPage'));
const AccountPage = lazy(() => import('../../features/account/AccountPage'));
const ContactPage = lazy(() => import('../../features/contact/ContactPage'));
const AdminLayout = lazy(() => import('../../features/admin/AdminLayout'));
const AdminContentList = lazy(() =>
  import('../../features/admin/AdminContent').then((m) => ({ default: m.AdminContentList })),
);
const AdminContentEditor = lazy(() =>
  import('../../features/admin/AdminContent').then((m) => ({ default: m.AdminContentEditor })),
);
const Dashboard = lazy(() =>
  import('../../features/admin/AdminManagement').then((m) => ({ default: m.Dashboard })),
);
const MediaLibrary = lazy(() =>
  import('../../features/admin/AdminManagement').then((m) => ({ default: m.MediaLibrary })),
);
const HomepageSettings = lazy(() => import('../../features/admin/AdminHomepage'));
const Records = lazy(() =>
  import('../../features/admin/AdminManagement').then((m) => ({ default: m.Records })),
);
const Settings = lazy(() =>
  import('../../features/admin/AdminManagement').then((m) => ({ default: m.Settings })),
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
export default function AppRoutes() {
  return (
    <Suspense fallback={<State loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          {publicPaths.map((p) => (
            <Route key={p} path={p} element={<PublicContent />} />
          ))}
          <Route path="lien-he" element={<ContactPage />} />
          {['dang-nhap', 'dang-ky', 'xac-thuc-email', 'quen-mat-khau', 'dat-lai-mat-khau'].map(
            (p) => (
              <Route key={p} path={p} element={<AuthPage />} />
            ),
          )}
          <Route path="tai-khoan" element={<AccountPage />} />
          <Route
            path="*"
            element={
              <div className="page-body">
                <Seo title="404" path="/404" noIndex />
                <h1>404</h1>
                <p>Trang không tồn tại / Page not found</p>
                <Link className="arrow-link" to="/">
                  HUGAMEX / Home
                </Link>
              </div>
            }
          />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="homepage" element={<HomepageSettings />} />
          <Route path="contact-messages" element={<Records resource="contact-messages" />} />
          <Route path="users" element={<Records resource="users" />} />
          <Route path="audit-logs" element={<Records resource="audit-logs" />} />
          <Route path="settings" element={<Settings />} />
          <Route path="roles" element={<Roles />} />
          <Route path=":resource" element={<AdminContentList />} />
          <Route path=":resource/:id" element={<AdminContentEditor />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
