import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Copy, Clock3, List } from 'lucide-react';
import { RichText } from '../common/Shared';
import type { Content, RichNode } from '../../types';
const plainText = (node: RichNode): string =>
  [node.text || '', ...(node.content || []).map(plainText)].join(' ');
export default function ArticleBody({
  article,
  onShare,
  feedback,
}: {
  article: Content;
  onShare: () => void;
  feedback: string;
}) {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const blocks = article.content.content || [];
  const headings = blocks
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.type === 'heading');
  const minutes = Math.max(
    1,
    Math.ceil(plainText(article.content).trim().split(/\s+/).length / (vi ? 250 : 200)),
  );
  return (
    <div className="editorial-layout">
      <aside className="editorial-sidebar">
        <div className="editorial-sidebar-inner">
          <div className="editorial-reading">
            <Clock3 size={16} />
            {vi ? `${minutes} phút đọc` : `${minutes} min read`}
          </div>
          {!!headings.length && (
            <nav
              className="editorial-toc"
              aria-label={vi ? 'Mục lục bài viết' : 'Article contents'}
            >
              <h2>
                <List size={16} />
                {vi ? 'Trong bài viết' : 'In this article'}
              </h2>
              {headings.map(({ node, index }, n) => (
                <a key={index} href={`#article-section-${index}`}>
                  <span>{String(n + 1).padStart(2, '0')}</span>
                  {plainText(node)}
                </a>
              ))}
            </nav>
          )}
          <button className="editorial-share" onClick={onShare}>
            <Copy size={15} />
            {vi ? 'Sao chép liên kết' : 'Copy article link'}
          </button>
          {feedback && (
            <p className="editorial-share-feedback" role="status">
              {feedback}
            </p>
          )}
        </div>
      </aside>
      <article className="prose editorial-prose">
        {blocks.map((node, index) => (
          <div key={index} id={node.type === 'heading' ? `article-section-${index}` : undefined}>
            <RichText node={node} />
          </div>
        ))}
        <div className="editorial-signoff">
          <span>HUGAMEX / JOURNAL</span>
          <p>
            {vi
              ? 'Góc nhìn về sản phẩm, chất liệu và hợp tác trong ngành may.'
              : 'Perspectives on garments, materials and collaboration.'}
          </p>
        </div>
        <section className="editorial-cta">
          <div className="eyebrow">{vi ? 'CÙNG TRAO ĐỔI' : 'LET’S TALK'}</div>
          <h2>
            {vi
              ? 'Đưa ý tưởng của bạn vào cuộc trao đổi.'
              : 'Bring your ideas to the conversation.'}
          </h2>
          <Link to="/lien-he">
            {vi ? 'Liên hệ HUGAMEX' : 'Contact HUGAMEX'}
            <ArrowUpRight size={18} />
          </Link>
        </section>
      </article>
    </div>
  );
}
