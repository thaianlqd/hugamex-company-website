import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Search, X } from 'lucide-react';
import { useState } from 'react';
import LocationMap from './LocationMap';
import { Reveal, RevealGroup, RevealItem } from '../common/Reveal';
import type { Content, Site } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
export default function BranchNetwork({ items }: { items: Content[] }) {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const [search, setSearch] = useState('');
  const site = useQuery({
    queryKey: ['site', i18n.language],
    queryFn: async () =>
      (await api.get<Site>('/public/site', { params: { locale: i18n.language } })).data,
  });
  const order = site.data?.sections.find((section) => section.key === 'branches')?.contentIds || [];
  const position = (item: Content) => {
    const n = order.indexOf(item.id);
    return n < 0 ? order.length : n;
  };
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .toLowerCase();
  const ordered = [...items]
    .sort((a, b) => position(a) - position(b))
    .filter((item) =>
      normalize(`${item.title} ${item.metadata.address}`).includes(normalize(search.trim())),
    );
  const settings = site.data?.settings || {};
  const headquarters = vi ? 'Trụ sở chính' : 'Head office';
  return (
    <>
      {settings.contactAddress && (
        <section className="headquarters">
          <div className="headquarters-copy">
            <div className="eyebrow">HUGAMEX / {vi ? 'TRỤ SỞ CHÍNH' : 'HEAD OFFICE'}</div>
            <h2>{headquarters}</h2>
            <p>{vi ? 'Công ty Cổ phần May Hữu Nghị' : 'Huu Nghi Garment Joint Stock Company'}</p>
            <p className="headquarters-address">
              <MapPin size={19} />
              {settings.contactAddress}
            </p>
            <div className="headquarters-links">
              {settings.contactPhone && (
                <a href={`tel:${settings.contactPhone.replace(/[^+0-9]/g, '')}`}>
                  {settings.contactPhone}
                </a>
              )}
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              )}
            </div>
            <Link className="arrow-link" to="/lien-he">
              {vi ? 'Liên hệ trụ sở' : 'Contact our office'}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <LocationMap address={settings.contactAddress} label={headquarters} />
        </section>
      )}
      <div className="network-facilities-heading">
        <div>
          <div className="eyebrow">HUGAMEX / MANUFACTURING</div>
          <h2>{vi ? 'Các cơ sở sản xuất' : 'Manufacturing facilities'}</h2>
        </div>
        <label className="catalog-search" htmlFor="facility-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">{vi ? 'Tìm cơ sở sản xuất' : 'Search facilities'}</span>
          <input
            id="facility-search"
            type="search"
            maxLength={200}
            placeholder={vi ? 'Tìm xí nghiệp, địa điểm…' : 'Search factory, location…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="factory-network">
        <Reveal className="factory-network-intro">
          <div className="eyebrow">HUGAMEX / NETWORK</div>
          <h2>
            {vi
              ? 'Cùng một chuyên môn.\nNhiều điểm kết nối.'
              : 'Shared expertise.\nConnected facilities.'}
          </h2>
          <p>
            {vi
              ? 'Thông tin cơ sở được trình bày theo hồ sơ doanh nghiệp. Nhân sự, năng lực và địa chỉ hành chính cần được xác nhận cho thời điểm làm việc.'
              : 'Facility information follows the company profile. Staffing, capacity and administrative addresses should be confirmed for the relevant period.'}
          </p>
          <Link className="arrow-link" to="/nang-luc-san-xuat">
            {vi ? 'Khám phá năng lực sản xuất' : 'Explore manufacturing capabilities'}
            <ArrowUpRight size={17} />
          </Link>
        </Reveal>
        <RevealGroup className="factory-network-list">
          {ordered.map((item, n) => (
            <RevealItem key={item.id}>
              <article className="factory-network-item">
                <span className="factory-network-number">{String(n + 1).padStart(2, '0')}</span>
                <div>
                  <h2>
                    <Link to={`/he-thong/${item.canonicalSlug || item.slug}`}>{item.title}</Link>
                  </h2>
                  {item.metadata.address && (
                    <p className="factory-address">
                      <MapPin size={15} />
                      {item.metadata.address}
                    </p>
                  )}
                  <p>{item.excerpt}</p>
                  <Link className="arrow-link" to={`/he-thong/${item.canonicalSlug || item.slug}`}>
                    {vi ? 'Thông tin cơ sở' : 'Facility details'}
                    <ArrowUpRight size={17} />
                  </Link>
                  {item.metadata.address && (
                    <a
                      className="factory-map-link"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.metadata.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin size={14} />
                      {vi ? 'Xem địa chỉ trên bản đồ' : 'View address on map'}
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </article>
            </RevealItem>
          ))}
          {!ordered.length && (
            <div className="public-empty">
              <h2>{vi ? 'Chưa tìm thấy cơ sở phù hợp' : 'No matching facilities'}</h2>
              <button className="arrow-link" onClick={() => setSearch('')}>
                <X size={16} />
                {vi ? 'Xóa tìm kiếm' : 'Clear search'}
              </button>
            </div>
          )}
        </RevealGroup>
      </div>
    </>
  );
}
