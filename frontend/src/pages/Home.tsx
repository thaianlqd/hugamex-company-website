import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MoveRight } from 'lucide-react';
import { presentationSlides, sectionCopy, sectionOrder } from '../content/sitePresentation';
import HomeHero from '../components/public/HomeHero';
import { Reveal, RevealGroup, RevealItem } from '../components/common/Reveal';
import { api } from '../services/api';
import { ArrowLink, ContentCard, Seo, State } from '../components/common/Shared';
import type { Content, PageResult, Site } from '../types';
export default function Home() {
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
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
  const products = useQuery({
    queryKey: ['home-products', i18n.language],
    queryFn: async () =>
      (
        await api.get<PageResult<Content>>('/public/products', {
          params: { locale: i18n.language, size: 6 },
        })
      ).data,
  });
  const slides = presentationSlides(i18n.language);
  const featuredNews = news.data?.items;
  const position = (key: string) => sectionOrder.indexOf(key);
  const copy = (key: string, fallback: string) => sectionCopy[key]?.[vi ? 2 : 3] || fallback;
  const visible = (key: string) => sectionOrder.includes(key);
  const heading = (key: string, fallback: string) => sectionCopy[key]?.[vi ? 0 : 1] || fallback;
  return (
    <>
      <Seo title={t('company')} path="/" organization />
      <HomeHero slides={slides} />
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
                decoding="async"
              />
              <span>01 — MATERIAL & CRAFT</span>
            </div>
            <Reveal className="section-copy">
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
            </Reveal>
          </section>
        )}
        {visible('manufacturing') && (
          <section style={{ order: position('manufacturing') }} className="section manufacturing">
            <Reveal className="section-heading">
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
            </Reveal>
            <p className="section-intro">
              {copy(
                'manufacturing',
                vi
                  ? 'Từ lựa chọn chất liệu đến kiểm tra thành phẩm: tìm hiểu những công đoạn tạo nên một sản phẩm may mặc.'
                  : 'From materials to finished garments: explore the stages of garment production.',
              )}
            </p>
            <RevealGroup className="process">
              {(vi
                ? ['Nguyên liệu', 'Cắt', 'May', 'Hoàn thiện', 'Kiểm tra chất lượng', 'Giao hàng']
                : ['Material', 'Cutting', 'Sewing', 'Finishing', 'Quality control', 'Delivery']
              ).map((label, i) => (
                <RevealItem key={label}>
                  <span>0{i + 1}</span>
                  <h3>{label}</h3>
                  <MoveRight size={24} />
                </RevealItem>
              ))}
            </RevealGroup>
          </section>
        )}
        {visible('products') && (
          <section style={{ order: position('products') }} className="section">
            <Reveal className="section-heading">
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
            </Reveal>
            <div className="product-grid">
              {products.data?.items.length
                ? products.data.items.map((item) => (
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
                        decoding="async"
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
                  ? 'Tìm hiểu cách kết nối nhu cầu sản phẩm, thông tin kỹ thuật và đầu mối hợp tác.'
                  : 'Connect product requirements, technical information and collaboration.',
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
                    ? 'Chất lượng bắt đầu từ thông số rõ ràng, mẫu đối chiếu và kiểm tra nhất quán.'
                    : 'Quality starts with clear specifications, reference samples and consistent checks.',
                )}
              </p>
              <ArrowLink to="/chung-nhan">{t('viewAll')}</ArrowLink>
            </div>
            <div>
              <div className="eyebrow">06 / RESPONSIBILITY</div>
              <h2>{t('sustainability')}</h2>
              <p>
                {vi
                  ? 'Khám phá những góc nhìn về con người, sử dụng nguồn lực và trách nhiệm trong ngành may.'
                  : 'Explore people, resource use and responsibility in garment manufacturing.'}
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
                  ? 'Một cuộc trao đổi rõ ràng là khởi đầu cho hợp tác lâu dài. Chia sẻ nhu cầu để cùng tìm hướng đi phù hợp.'
                  : 'Clear communication starts lasting collaboration. Share your requirements to explore the next steps.',
              )}
            </p>
            <ArrowLink to="/doi-tac">{t('partners')}</ArrowLink>
          </section>
        )}
        {visible('news') && (
          <section style={{ order: position('news') }} className="section">
            <Reveal className="section-heading">
              <div>
                <div className="eyebrow">08 / JOURNAL</div>
                <h2>{heading('news', t('news') + ' & ' + (vi ? 'góc nhìn' : 'perspectives'))}</h2>
              </div>
              <ArrowLink to="/tin-tuc">{t('viewAll')}</ArrowLink>
            </Reveal>
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
