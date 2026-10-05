import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Site } from '../../types';
import { FadeIn } from '../../components/common/Reveal';
import FloatingContact from '../../components/public/FloatingContact';
import { Menu, X, UserRound, ArrowUpRight } from 'lucide-react';
const nav = [
  ['about', '/gioi-thieu'],
  ['capabilities', '/nang-luc-san-xuat'],
  ['products', '/san-pham'],
  ['network', '/he-thong'],
  ['news', '/tin-tuc'],
  ['contact', '/lien-he'],
];
export default function PublicLayout() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
    else
      window.requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    setOpen(false);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const site = useQuery({
    queryKey: ['site', i18n.language],
    queryFn: async () =>
      (await api.get<Site>('/public/site', { params: { locale: i18n.language } })).data,
  });
  const settings = site.data?.settings || {};
  const language = () => {
    const next = i18n.language === 'vi' ? 'en' : 'vi';
    localStorage.setItem('language', next);
    void i18n.changeLanguage(next);
  };
  return (
    <>
      <a className="skip" href="#main">
        {i18n.language === 'vi' ? 'Đến nội dung' : 'Skip to content'}
      </a>
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="HUGAMEX home">
          HUGAMEX<span>HUU NGHI GARMENT</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main">
          {nav.map(([key, to]) => (
            <NavLink key={key} to={to}>
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button className="language" onClick={language} aria-label="Change language">
            {i18n.language.toUpperCase()}
            <span>/ {i18n.language === 'vi' ? 'EN' : 'VI'}</span>
          </button>
          <Link to="/tai-khoan" aria-label={t('account')}>
            <UserRound size={20} />
          </Link>
          <button
            ref={trigger}
            className="menu-toggle"
            aria-label={t('menu')}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <dialog
        className="mobile-menu"
        ref={dialog}
        onCancel={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
      >
        <div className="drawer-head">
          <span className="wordmark">HUGAMEX</span>
          <button aria-label={t('close')} onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([key, to]) => (
            <NavLink key={key} to={to} onClick={() => setOpen(false)}>
              {t(key)}
              <ArrowUpRight size={20} />
            </NavLink>
          ))}
        </nav>
        <button onClick={language}>VI / EN</button>
        <Link to="/dang-nhap">{t('login')}</Link>
      </dialog>
      <main id="main">
        <Outlet />
      </main>
      <FadeIn>
        <footer>
          <div className="footer-top">
            <div>
              <Link className="wordmark" to="/">
                HUGAMEX<span>HUU NGHI GARMENT</span>
              </Link>
              <p>{settings.companyName || t('company')}</p>
              {settings.contactAddress && (
                <p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.contactAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {settings.contactAddress}
                  </a>
                </p>
              )}
              {settings.contactPhone && (
                <a href={`tel:${settings.contactPhone.replace(/[^+0-9]/g, '')}`}>
                  {settings.contactPhone}
                </a>
              )}
              {settings.contactEmail && (
                <p>
                  <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                </p>
              )}
              {settings.officeHours && <p>{settings.officeHours}</p>}
              <span className="preview-badge">
                {i18n.language === 'vi' ? 'Bản xem trước' : 'Preview edition'}
              </span>
            </div>
            <div className="footer-links">
              {nav.map(([key, to]) => (
                <Link key={key} to={to}>
                  {t(key)}
                </Link>
              ))}
            </div>
            <div className="footer-links">
              {[
                ['sustainability', '/phat-trien-ben-vung'],
                ['certifications', '/chung-nhan'],
                ['partners', '/doi-tac'],
                ['careers', '/tuyen-dung'],
              ].map(([key, to]) => (
                <Link key={key} to={to}>
                  {t(key)}
                </Link>
              ))}
              {[
                ['Facebook', settings.facebookUrl],
                ['LinkedIn', settings.linkedinUrl],
              ]
                .filter(([, url]) => !!url)
                .map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ))}
              <Link to="/lien-he">
                {i18n.language === 'vi' ? 'Trao đổi với HUGAMEX' : 'Talk to HUGAMEX'}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} HUGAMEX</span>
            <span>VIETNAM · GARMENT MANUFACTURING</span>
            <Link to="/chinh-sach-bao-mat">{t('privacy')}</Link>
          </div>
        </footer>
      </FadeIn>
      <FloatingContact settings={settings} />
    </>
  );
}
