import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { portalUrl } from '../portals';
import ContentImage from '../../components/common/ContentImage';
export default function AdminAuthLayout() {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  return (
    <div className="admin-auth-root">
      <a className="skip" href="#main">
        {vi ? 'Đến nội dung' : 'Skip to content'}
      </a>
      <div className="admin-auth-panel">
        <header className="admin-auth-header">
          <Link className="wordmark" to="/admin">
            HUGAMEX<span>ADMIN / CMS</span>
          </Link>
          <button
            aria-label={vi ? 'Đổi ngôn ngữ' : 'Change language'}
            onClick={() => void i18n.changeLanguage(vi ? 'en' : 'vi')}
          >
            VI / EN
          </button>
        </header>
        <main id="main">
          <Outlet />
        </main>
        <nav aria-label={vi ? 'Trang khách hàng' : 'Public navigation'}>
          <a className="admin-auth-back" href={portalUrl('public') || '/'}>
            {vi ? 'Về trang khách hàng' : 'Public website'}
            <ArrowUpRight size={16} />
          </a>
        </nav>
      </div>
      <aside className="admin-auth-visual">
        <ContentImage
          src="https://images.pexels.com/photos/5830692/pexels-photo-5830692.jpeg?auto=compress&cs=tinysrgb&w=1400"
          alt={vi ? 'Ảnh minh họa nghề may' : 'Illustrative tailoring photograph'}
          width={1000}
          height={1200}
          loading="eager"
        />
        <div>
          <span>HUGAMEX / CONTENT MANAGEMENT</span>
          <h2>{vi ? 'Chỉn chu trong\ntừng chi tiết.' : 'Care in\nevery detail.'}</h2>
          <p>
            {vi
              ? 'Một không gian để quản lý câu chuyện, sản phẩm và thông tin của doanh nghiệp.'
              : 'A workspace for company stories, products and information.'}
          </p>
        </div>
      </aside>
    </div>
  );
}
