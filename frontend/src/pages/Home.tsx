import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDown, MoveRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../services/api';
import { ArrowLink, ContentCard, Seo, State } from '../components/common/Shared';
import type { Content, PageResult, Site } from '../types';
export default function Home() {
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const reduced = useReducedMotion();
  const [heroIndex, setHeroIndex] = useState(0);
  const site = useQuery({
    queryKey: ['site', i18n.language],
    queryFn: async () =>
      (await api.get<Site>('/public/site', { params: { locale: i18n.language } })).data,
  });
  const news = useQuery({
    queryKey: ['home-news', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/posts', {
          params: { locale: i18n.language, size: 3 },
        })
      ).data,
  });
  const heroes = useQuery({
    queryKey: ['heroes', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/hero-slides', {
          params: { locale: i18n.language, size: 5 },
        })
      ).data,
  });
  const slides = heroes.data?.items || [];
  const hero = slides[heroIndex % slides.length];
  const featuredNews = site.data?.featured?.news?.length
    ? site.data.featured.news
    : news.data?.items;
  const position = (key: string) => site.data?.sections.find((s) => s.key === key)?.position ?? 0;
  const copy = (key: string, fallback: string) => {
    const section = site.data?.sections.find((s) => s.key === key);
    return (
      (vi ? section?.subheadlineVi : section?.subheadlineEn) ||
      site.data?.featured?.[key]?.[0]?.excerpt ||
      fallback
    );
  };
  const visible = (key: string) =>
    site.data?.sections.find((s) => s.key === key)?.enabled !== false;
  const heading = (key: string, fallback: string) => {
    const section = site.data?.sections.find((s) => s.key === key);
    return (vi ? section?.headlineVi : section?.headlineEn) || fallback;
  };
  return (
    <>
      <Seo title={t('company')} path="/" organization />
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" />
            VIETNAM · GARMENT MANUFACTURING
          </div>
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {hero ? (
              hero.title.split('\n').map((line, index, lines) => (
                <span key={index}>
                  {index > 0 && <br />}
                  {index === lines.length - 1 && lines.length > 1 ? <em>{line}</em> : line}
                </span>
              ))
            ) : vi ? (
              <>
                Từ từng
                <br />
                đường kim,
                <br />
                <em>đến giá trị.</em>
              </>
            ) : (
              <>
                Thoughtfully
                <br />
                made.
                <br />
                <em>Precisely sewn.</em>
              </>
            )}
          </motion.h1>
          <p>
            {hero?.excerpt ||
              (vi
                ? 'HUGAMEX — Công ty Cổ phần May Hữu Nghị. Giới thiệu năng lực và chuyên môn trong lĩnh vực sản xuất may mặc.'
                : 'HUGAMEX — Huu Nghi Garment. Explore our garment manufacturing capabilities and expertise.')}
          </p>
          <Link className="button" to={hero?.metadata.link || '/gioi-thieu'}>
            {t('discover')}
            <ArrowUpRight size={20} />
          </Link>
          {!hero && <div className="hero-note">{t('placeholder')}</div>}
          {slides.length > 1 && (
            <div className="hero-controls">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  aria-label={`${vi ? 'Xem slide' : 'Show slide'} ${index + 1}`}
                  aria-pressed={heroIndex % slides.length === index}
                  onClick={() => setHeroIndex(index)}
                >
                  {String(index + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="hero-visual">
          <img
            src={
              hero?.featuredMediaId
                ? `${api.defaults.baseURL}/media/${hero.featuredMediaId}`
                : heroes.isPending
                  ? '/assets/garment-study.svg'
                  : 'https://images.pexels.com/photos/5830692/pexels-photo-5830692.jpeg?auto=compress&cs=tinysrgb&w=1200'
            }
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/garment-study.svg';
            }}
            alt={
              vi
                ? hero?.featuredMediaAlt || hero?.title || 'Ảnh minh họa tạm về may mặc'
                : hero?.featuredMediaAlt || hero?.title || 'Temporary stock photograph of tailoring'
            }
            width="840"
            height="1000"
            fetchPriority="high"
          />
          <span className="visual-index">
            H / {String((heroIndex % Math.max(slides.length, 1)) + 1).padStart(2, '0')}
          </span>
          <span className="visual-caption">
            THE ART OF MAKING
            <br />
            {!hero || hero.featuredMediaAlt?.includes('Temporary stock')
              ? 'TEMPORARY STOCK IMAGE'
              : 'HUGAMEX'}
          </span>
        </div>
        <a className="hero-scroll" href="#about">
          <ArrowDown size={16} />
          {vi ? 'Khám phá câu chuyện' : 'Explore our story'}
        </a>
      </section>
      <div className="metric-strip">
        {[
          ['EXPERIENCE', vi ? 'Kinh nghiệm' : 'Experience'],
          ['CRAFT', vi ? 'Chuyên môn' : 'Craftsmanship'],
          ['PROCESS', vi ? 'Quy trình' : 'Process'],
          ['COMMITMENT', vi ? 'Cam kết' : 'Commitment'],
        ].map(([en, label]) => (
          <div key={en}>
            <strong>{label}</strong>
            <span>{en}</span>
          </div>
        ))}
      </div>
      <div className="home-sections">
        {visible('about') && (
          <section style={{ order: position('about') }} id="about" className="section about-grid">
            <div className="textile-visual">
              <img
                src={
                  site.data?.featured?.about?.[0]?.featuredMediaId
                    ? `${api.defaults.baseURL}/media/${site.data.featured.about[0].featuredMediaId}`
                    : site.isPending
                      ? '/assets/textile-study.svg'
                      : 'https://images.pexels.com/photos/12362544/pexels-photo-12362544.jpeg?auto=compress&cs=tinysrgb&w=1000'
                }
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/textile-study.svg';
                }}
                alt={
                  vi ? 'Minh họa cấu trúc chất liệu dệt' : 'Illustration of textile construction'
                }
                width="700"
                height="650"
                loading="lazy"
              />
              <span>01 — MATERIAL & CRAFT</span>
            </div>
            <div className="section-copy">
              <div className="eyebrow">01 / {t('about')}</div>
              <h2>
                {heading(
                  'about',
                  vi
                    ? 'May mặc là chuyên môn.\nCon người là nền tảng.'
                    : 'Made with expertise.\nBuilt around people.',
                )}
              </h2>
              <p>
                {copy(
                  'about',
                  vi
                    ? 'Một góc nhìn mới về HUGAMEX: năng lực sản xuất, sự chỉn chu trong từng công đoạn và định hướng hợp tác lâu dài.'
                    : 'A closer look at HUGAMEX: manufacturing expertise, care at every stage and long-term collaboration.',
                )}
              </p>
              <ArrowLink to="/gioi-thieu">{vi ? 'Câu chuyện HUGAMEX' : 'Our story'}</ArrowLink>
            </div>
          </section>
        )}
        {visible('manufacturing') && (
          <section style={{ order: position('manufacturing') }} className="section manufacturing">
            <div className="section-heading">
              <div>
                <div className="eyebrow">02 / {t('capabilities')}</div>
                <h2>
                  {heading(
                    'manufacturing',
                    vi ? 'Một quy trình.\nTừng chi tiết.' : 'One process.\nEvery detail.',
                  )}
                </h2>
              </div>
              <ArrowLink to="/nang-luc-san-xuat">{t('manufacturing')}</ArrowLink>
            </div>
            <p className="section-intro">
              {copy(
                'manufacturing',
                vi
                  ? 'Mô hình minh họa chuỗi sản xuất may mặc. Quy trình cụ thể sẽ được doanh nghiệp xác nhận trước khi xuất bản.'
                  : 'An illustrative manufacturing workflow. Company-specific details require approval.',
              )}
            </p>
            <div className="process">
              {(vi
                ? ['Nguyên liệu', 'Cắt', 'May', 'Hoàn thiện', 'Kiểm tra chất lượng', 'Giao hàng']
                : ['Material', 'Cutting', 'Sewing', 'Finishing', 'Quality control', 'Delivery']
              ).map((label, i) => (
                <div key={label}>
                  <span>0{i + 1}</span>
                  <h3>{label}</h3>
                  <MoveRight size={24} />
                </div>
              ))}
            </div>
          </section>
        )}
        {visible('products') && (
          <section style={{ order: position('products') }} className="section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">03 / {t('products')}</div>
                <h2>
                  {heading(
                    'products',
                    vi ? 'Chuyên môn tạo nên\nsự khác biệt.' : 'Expertise in\nevery stitch.',
                  )}
                </h2>
              </div>
              <ArrowLink to="/san-pham">{t('viewAll')}</ArrowLink>
            </div>
            <div className="product-grid">
              {site.data?.featured?.products?.length
                ? site.data.featured.products.map((item) => (
                    <ContentCard key={item.id} item={item} base="/san-pham" />
                  ))
                : (vi
                    ? ['Áo khoác & outerwear', 'Trang phục thể thao', 'Quần & thời trang']
                    : ['Jackets & outerwear', 'Sportswear', 'Trousers & fashion']
                  ).map((label, i) => (
                    <Link className={`product-study study-${i}`} to="/san-pham" key={label}>
                      <img
                        src="/assets/garment-study.svg"
                        alt=""
                        width="600"
                        height="750"
                        loading="lazy"
                      />
                      <span>
                        <small>0{i + 1} / EXPERTISE</small>
                        <h3>{label}</h3>
                        <ArrowUpRight size={22} />
                      </span>
                    </Link>
                  ))}
            </div>
          </section>
        )}
        {visible('branches') && (
          <section style={{ order: position('branches') }} className="network-section section">
            <div className="eyebrow">04 / {t('network')}</div>
            <h2>
              {heading(
                'branches',
                vi
                  ? 'Kết nối năng lực.\nMở rộng cơ hội.'
                  : 'Connected expertise.\nShared opportunities.',
              )}
            </h2>
            <p>
              {copy(
                'branches',
                vi
                  ? 'Khám phá hệ thống nhà máy và văn phòng. Địa chỉ, quy mô và liên hệ sẽ hiển thị sau khi được doanh nghiệp xác nhận.'
                  : 'Explore our factory and office network. Locations and contact details require confirmation.',
              )}
            </p>
            <ArrowLink to="/he-thong">{t('network')}</ArrowLink>
            <div className="network-mark" aria-hidden="true">
              H.
            </div>
          </section>
        )}
        {visible('quality') && (
          <section style={{ order: position('quality') }} className="section principles">
            <div>
              <div className="eyebrow">05 / QUALITY</div>
              <h2>{heading('quality', t('certifications'))}</h2>
              <p>
                {copy(
                  'quality',
                  vi
                    ? 'Hồ sơ chất lượng và chứng nhận đang chờ xác minh hiệu lực.'
                    : 'Quality documents and certificate validity await verification.',
                )}
              </p>
              <ArrowLink to="/chung-nhan">{t('viewAll')}</ArrowLink>
            </div>
            <div>
              <div className="eyebrow">06 / RESPONSIBILITY</div>
              <h2>{t('sustainability')}</h2>
              <p>
                {vi
                  ? 'Định hướng trách nhiệm với con người, sản phẩm và môi trường cần được doanh nghiệp phê duyệt.'
                  : 'Our approach to people, products and the environment requires company approval.'}
              </p>
              <ArrowLink to="/phat-trien-ben-vung">{t('discover')}</ArrowLink>
            </div>
          </section>
        )}
        {visible('partners') && (
          <section style={{ order: position('partners') }} className="section partners">
            <div className="eyebrow">07 / {t('partners')}</div>
            <h2>
              {heading(
                'partners',
                vi ? 'Cùng xây dựng\ngiá trị lâu dài.' : 'Creating lasting\nvalue together.',
              )}
            </h2>
            <p>
              {copy(
                'partners',
                vi
                  ? 'Danh sách đối tác sẽ được công bố sau khi xác nhận quyền sử dụng tên và thương hiệu.'
                  : 'Partner names and brands will be published after approval.',
              )}
            </p>
            <ArrowLink to="/doi-tac">{t('partners')}</ArrowLink>
          </section>
        )}
        {visible('news') && (
          <section style={{ order: position('news') }} className="section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">08 / JOURNAL</div>
                <h2>{heading('news', t('news') + ' & ' + (vi ? 'góc nhìn' : 'perspectives'))}</h2>
              </div>
              <ArrowLink to="/tin-tuc">{t('viewAll')}</ArrowLink>
            </div>
            {featuredNews?.length ? (
              <div className="article-grid">
                {featuredNews.map((item) => (
                  <ContentCard key={item.id} item={item} base="/tin-tuc" />
                ))}
              </div>
            ) : (
              <State
                loading={news.isPending}
                error={news.isError}
                retry={() => void news.refetch()}
              />
            )}
          </section>
        )}
      </div>
      <section className="contact-cta">
        <div>
          <div className="eyebrow">LET’S TALK</div>
          <h2>{vi ? 'Bắt đầu một\ncuộc trao đổi.' : 'Let’s start\na conversation.'}</h2>
        </div>
        <Link to="/lien-he" aria-label={t('contact')}>
          <ArrowUpRight size={62} />
        </Link>
      </section>
    </>
  );
}
