import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { presentationSlides, sectionCopy } from '../content/sitePresentation';
import HomeHero from '../components/public/HomeHero';
import BrandImage from '../components/public/BrandImage';
import CategoryShowcase from '../components/public/CategoryShowcase';
import CustomerReferences from '../components/public/CustomerReferences';
import { Reveal } from '../components/common/Reveal';
import { api } from '../services/api';
import { ArrowLink, ContentCard, Seo, State } from '../components/common/Shared';
import type { Content, PageResult } from '../types';
export default function Home() {
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const news = useQuery({
    queryKey: ['home-news', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/posts', {
          params: { locale: i18n.language, size: 3 },
        })
      ).data,
  });
  const copy = (key: string, heading = false) =>
    sectionCopy[key][heading ? (vi ? 0 : 1) : vi ? 2 : 3];
  return (
    <>
      <Seo title={t('company')} path="/" organization />
      <HomeHero slides={presentationSlides(i18n.language)} />
      <div className="brand-ribbon">
        <span>HUU NGHI GARMENT</span>
        <span>{vi ? 'CHUYÊN MÔN • CHẤT LIỆU • CON NGƯỜI' : 'EXPERTISE • MATERIALS • PEOPLE'}</span>
        <span>HUGAMEX / VIETNAM</span>
      </div>
      <section id="about" className="section brand-split brand-intro">
        <Reveal className="brand-copy">
          <div className="eyebrow">01 / HUGAMEX</div>
          <h2>{copy('about', true)}</h2>
          <p>{copy('about')}</p>
          <ArrowLink to="/gioi-thieu">
            {vi ? 'Câu chuyện doanh nghiệp' : 'Our company story'}
          </ArrowLink>
        </Reveal>
        <BrandImage photo="intro" />
      </section>
      <section className="brand-production">
        <BrandImage photo="production" />
        <Reveal className="brand-production-copy">
          <div className="eyebrow">02 / {t('capabilities')}</div>
          <h2>{copy('manufacturing', true)}</h2>
          <p>{copy('manufacturing')}</p>
          <ArrowLink to="/nang-luc-san-xuat">{t('manufacturing')}</ArrowLink>
        </Reveal>
      </section>
      <section className="section brand-activities">
        <div className="eyebrow">HUGAMEX / {vi ? 'LĨNH VỰC HOẠT ĐỘNG' : 'BUSINESS ACTIVITIES'}</div>
        <h2>
          {vi
            ? 'Từ sản xuất.\nĐến kết nối thương mại.'
            : 'From manufacturing.\nTo business connections.'}
        </h2>
        <div className="activity-lines">
          {(vi
            ? [
                [
                  '01',
                  'Sản xuất & xuất nhập khẩu',
                  'Hàng may mặc, nguyên phụ liệu, máy móc, thiết bị và phụ tùng ngành may.',
                ],
                [
                  '02',
                  'Không gian & thiết bị',
                  'Cho thuê nhà xưởng, văn phòng, nhà ở, máy móc và phương tiện vận tải đường bộ.',
                ],
                [
                  '03',
                  'Phát triển & hợp tác',
                  'Bất động sản, xây dựng dân dụng, công nghiệp và hợp tác đầu tư trong, ngoài nước.',
                ],
              ]
            : [
                [
                  '01',
                  'Manufacturing & trade',
                  'Garments, materials, machinery, equipment and garment-industry spare parts.',
                ],
                [
                  '02',
                  'Spaces & equipment',
                  'Factory, office, housing, machinery and road-vehicle leasing.',
                ],
                [
                  '03',
                  'Development & collaboration',
                  'Real estate, civil and industrial construction, domestic and international investment cooperation.',
                ],
              ]
          ).map(([n, title, description]) => (
            <div key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <p className="source-note">
          {vi
            ? 'Lĩnh vực được giới thiệu trong tư liệu doanh nghiệp; phạm vi hợp tác được trao đổi theo yêu cầu.'
            : 'Activities described in company materials; specific collaboration scope is discussed by enquiry.'}
        </p>
      </section>
      <section className="section home-categories">
        <Reveal className="section-heading">
          <div>
            <div className="eyebrow">03 / {t('products')}</div>
            <h2>
              {vi
                ? 'Danh mục rõ ràng.\nSản phẩm đúng nhu cầu.'
                : 'Explore the category.\nFind the right garment.'}
            </h2>
          </div>
          <ArrowLink to="/san-pham">{t('viewAll')}</ArrowLink>
        </Reveal>
        <CategoryShowcase compact limit={4} />
      </section>
      <section className="section brand-split brand-network">
        <BrandImage photo="network" />
        <Reveal className="brand-copy">
          <div className="eyebrow">04 / {t('network')}</div>
          <h2>{copy('branches', true)}</h2>
          <p>{copy('branches')}</p>
          <div className="factory-link-list">
            {['123', '45', '6', '7'].map((n) => (
              <Link key={n} to={`/he-thong/xi-nghiep-may-${n}`}>
                <span>
                  {vi ? 'Xí nghiệp may' : 'Garment factory'} {n}
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
          <ArrowLink to="/he-thong">
            {vi ? 'Trụ sở & hệ thống' : 'Head office & facilities'}
          </ArrowLink>
        </Reveal>
      </section>
      <section className="section home-customers">
        <div className="section-heading">
          <div>
            <div className="eyebrow">05 / {t('partners')}</div>
            <h2>
              {vi
                ? 'Những kết nối\ntrong hồ sơ doanh nghiệp.'
                : 'Connections in\nour company records.'}
            </h2>
          </div>
          <ArrowLink to="/doi-tac">
            {vi ? 'Khách hàng & cơ cấu 2022' : 'Customers & 2022 composition'}
          </ArrowLink>
        </div>
        <CustomerReferences compact />
      </section>
      <section className="section brand-split brand-quality">
        <Reveal className="brand-copy">
          <div className="eyebrow">06 / {t('certifications')}</div>
          <h2>
            {vi
              ? 'Chất lượng trong chi tiết.\nGiá trị qua thời gian.'
              : 'Quality in the details.\nValue across time.'}
          </h2>
          <p>{copy('quality')}</p>
          <ArrowLink to="/chung-nhan">
            {vi ? 'Chứng nhận & giải thưởng' : 'Certificates & awards'}
          </ArrowLink>
        </Reveal>
        <BrandImage photo="quality" />
      </section>
      <section className="section home-journal">
        <div className="section-heading">
          <div>
            <div className="eyebrow">07 / HUGAMEX JOURNAL</div>
            <h2>{copy('news', true)}</h2>
          </div>
          <ArrowLink to="/tin-tuc">{t('viewAll')}</ArrowLink>
        </div>
        {news.isPending || news.isError ? (
          <State loading={news.isPending} error={news.isError} retry={() => void news.refetch()} />
        ) : (
          <div className="article-grid journal-grid">
            {news.data?.items.map((item) => (
              <ContentCard key={item.id} item={item} base="/tin-tuc" />
            ))}
          </div>
        )}
      </section>
      <section className="brand-contact">
        <BrandImage photo="logistics" />
        <div>
          <div className="eyebrow">HUGAMEX / {vi ? 'CÙNG HỢP TÁC' : 'WORK WITH US'}</div>
          <h2>
            {vi
              ? 'Ý tưởng của bạn.\nCuộc trao đổi tiếp theo.'
              : 'Your next idea.\nOur next conversation.'}
          </h2>
          <p>
            {vi
              ? 'Chia sẻ nhóm sản phẩm, thiết kế và nhu cầu để bắt đầu.'
              : 'Share your product category, designs and requirements to get started.'}
          </p>
          <ArrowLink to="/lien-he">{t('contact')}</ArrowLink>
        </div>
      </section>
    </>
  );
}
