import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Content } from '../../types';
import { api } from '../../services/api';
import ContentImage, { validHeroImageUrl } from '../common/ContentImage';
function image(slide?: Content) {
  return slide?.featuredMediaId
    ? `${api.defaults.baseURL}/media/${slide.featuredMediaId}`
    : validHeroImageUrl(slide?.metadata.externalImageUrl || '')
      ? slide!.metadata.externalImageUrl
      : '/assets/garment-study.svg';
}
export default function HomeHero({ slides }: { slides: Content[] }) {
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const start = useRef(0);
  const count = slides.length;
  const active = index % Math.max(count, 1);
  const hero = slides[active];
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (count < 2 || paused || hovered || focused || hidden || reduced) return;
    const timer = window.setTimeout(() => setIndex((n) => n + 1), 6000);
    return () => window.clearTimeout(timer);
  }, [index, count, paused, hovered, focused, hidden, reduced]);
  useEffect(() => {
    if (count > 1) {
      const next = new Image();
      next.crossOrigin = 'anonymous';
      next.referrerPolicy = 'no-referrer';
      next.fetchPriority = 'low';
      next.src = image(slides[(active + 1) % count]);
    }
  }, [active, count, slides]);
  const go = (n: number) =>
    setIndex((current) => current + ((n - active + count) % count || count));
  return (
    <section
      className="hero"
      aria-roledescription={vi ? 'Trình chiếu' : 'Carousel'}
      aria-label={vi ? 'Giới thiệu HUGAMEX' : 'Introducing HUGAMEX'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onTouchStart={(e) => {
        start.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const delta = e.changedTouches[0].clientX - start.current;
        if (Math.abs(delta) > 60 && count > 1) go(active + (delta < 0 ? 1 : -1));
      }}
    >
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="tiny-line" />
          VIETNAM · GARMENT MANUFACTURING
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={hero?.id || 'intro'}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          >
            <h1>
              {(
                hero?.title ||
                (vi ? 'Từ từng\nđường kim,\nđến giá trị.' : 'Thoughtfully\nmade.\nPrecisely sewn.')
              )
                .split('\n')
                .map((line, n, lines) => (
                  <span key={n}>
                    {n > 0 && <br />}
                    {n === lines.length - 1 ? <em>{line}</em> : line}
                  </span>
                ))}
            </h1>
            <p>
              {hero?.excerpt ||
                (vi
                  ? 'HUGAMEX — Công ty Cổ phần May Hữu Nghị. Khám phá sản phẩm và câu chuyện may mặc.'
                  : 'HUGAMEX — Huu Nghi Garment. Explore garment products and perspectives.')}
            </p>
            <Link className="button" to={hero?.metadata.link || '/gioi-thieu'}>
              {t('discover')}
              <ArrowUpRight size={20} />
            </Link>
          </motion.div>
        </AnimatePresence>
        {count > 1 && (
          <div className="hero-controls">
            <button aria-label={t('previous')} onClick={() => go(active - 1)}>
              <ArrowLeft size={18} />
            </button>
            {slides.map((slide, n) => (
              <button
                key={slide.id}
                aria-label={`${vi ? 'Xem ảnh' : 'Show slide'} ${n + 1}`}
                aria-pressed={n === active}
                onClick={() => go(n)}
              >
                {String(n + 1).padStart(2, '0')}
              </button>
            ))}
            <button aria-label={t('next')} onClick={() => go(active + 1)}>
              <ArrowRight size={18} />
            </button>
            {!reduced && (
              <button
                aria-label={
                  paused
                    ? vi
                      ? 'Tiếp tục trình chiếu'
                      : 'Play slideshow'
                    : vi
                      ? 'Tạm dừng trình chiếu'
                      : 'Pause slideshow'
                }
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="hero-visual">
        <AnimatePresence initial={false}>
          <motion.div
            className="hero-photo"
            key={hero?.id || 'intro'}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.6 }}
          >
            <ContentImage
              src={image(hero)}
              alt={
                hero?.featuredMediaAlt ||
                (vi ? 'Ảnh minh họa nghề may' : 'Illustrative garment photograph')
              }
              width={1000}
              height={1100}
              loading="eager"
              fetchPriority={active === 0 ? 'high' : 'auto'}
            />
          </motion.div>
        </AnimatePresence>
        <span className="visual-index">H / {String(active + 1).padStart(2, '0')}</span>
        <span className="visual-caption">
          {vi ? 'ẢNH MINH HỌA / THE ART OF MAKING' : 'ILLUSTRATIVE / THE ART OF MAKING'}
        </span>
      </div>
      <a className="hero-scroll" href="#about">
        <ArrowDown size={16} />
        {vi ? 'Khám phá câu chuyện' : 'Explore our story'}
      </a>
    </section>
  );
}
