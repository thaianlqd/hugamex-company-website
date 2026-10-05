import { useTranslation } from 'react-i18next';
import type { Content, RichNode } from '../../types';
import { ArrowLink, RichText } from '../common/Shared';
import BrandImage, { type PhotoKey } from './BrandImage';
import { Reveal, RevealGroup, RevealItem } from '../common/Reveal';
export default function CorporateBody({ article }: { article: Content }) {
  const { t, i18n } = useTranslation();
  const key = article.metadata.routeKey;
  const imageSet: PhotoKey[] =
    key === 'nang-luc-san-xuat'
      ? ['cutting', 'production', 'logistics']
      : article.kind === 'CERTIFICATION'
        ? ['fabricDetail', 'technical', 'finishing']
        : ['vision', 'history', 'careers'];
  const blocks: { heading?: RichNode; nodes: RichNode[] }[] = [];
  for (const node of article.content.content || []) {
    if (node.type === 'heading' && node.attrs?.level === 2)
      blocks.push({ heading: node, nodes: [] });
    else {
      if (!blocks.length) blocks.push({ nodes: [] });
      blocks[blocks.length - 1].nodes.push(node);
    }
  }
  if (key === 'chinh-sach-bao-mat')
    return (
      <article className="prose">
        <RichText node={article.content} />
      </article>
    );
  return (
    <div className={`corporate-body corporate-${key}`}>
      <RevealGroup className="corporate-sections">
        {blocks.map((block, n) => (
          <RevealItem
            key={n}
            className={`corporate-block${n % 3 === 1 ? ' corporate-block-visual' : ''}`}
          >
            {n % 3 === 1 && <BrandImage photo={imageSet[Math.floor(n / 3) % imageSet.length]} />}
            <span className="corporate-index">{String(n + 1).padStart(2, '0')}</span>
            <div>
              {block.heading && <RichText node={block.heading} />}
              {block.nodes.map((node, i) => (
                <RichText key={i} node={node} />
              ))}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
      <Reveal className="corporate-next">
        <div>
          <div className="eyebrow">HUGAMEX / {i18n.language === 'vi' ? 'KẾT NỐI' : 'CONNECT'}</div>
          <h2>
            {i18n.language === 'vi'
              ? 'Cùng bắt đầu một cuộc trao đổi.'
              : 'Let’s start a conversation.'}
          </h2>
        </div>
        <div>
          {key === 'gioi-thieu' && (
            <>
              <ArrowLink to="/gioi-thieu/lich-su">{t('history')}</ArrowLink>
              <ArrowLink to="/gioi-thieu/tam-nhin-su-menh">{t('vision')}</ArrowLink>
            </>
          )}
          <ArrowLink to="/lien-he">{t('contact')}</ArrowLink>
        </div>
      </Reveal>
    </div>
  );
}
