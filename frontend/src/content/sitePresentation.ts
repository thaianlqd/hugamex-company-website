// Website presentation is developer-owned. Edit this file to change hero/copy/section order.
import photos from './stockPhotos.json';
import type { Content } from '../types';
export const sectionOrder = [
  'about',
  'manufacturing',
  'products',
  'branches',
  'partners',
  'quality',
  'news',
];
export const sectionCopy: Record<string, string[]> = {
  about: [
    'HUGAMEX.\nChuyên môn may mặc.',
    'HUGAMEX.\nGarment expertise.',
    'Công ty Cổ phần May Hữu Nghị — sản xuất và xuất nhập khẩu hàng may mặc, nguyên phụ liệu, máy móc và thiết bị.',
    'Huu Nghi Garment JSC — garment manufacturing and import-export of garments, materials, machinery and equipment.',
  ],
  manufacturing: [
    'Công nghệ phục vụ\ntừng công đoạn.',
    'Technology for\neach production stage.',
    'Hồ sơ doanh nghiệp giới thiệu thiết bị trải vải tự động, máy cắt tự động và các chuyền may.',
    'The company profile presents automatic fabric spreading, automatic cutting machines and sewing lines.',
  ],
  products: [
    'Năng lực trong\ntừng nhóm sản phẩm.',
    'Capabilities across\nproduct families.',
    'Áo khoác, fleece, sơ mi, quần & quần short và trang phục trẻ nhỏ.',
    'Outerwear, fleece, shirts, pants & shorts and toddler garments.',
  ],
  branches: [
    'Hệ thống\ncơ sở sản xuất.',
    'Production\nfacility network.',
    'Tìm hiểu bốn xí nghiệp được giới thiệu trong hồ sơ doanh nghiệp.',
    'Explore the four factories presented in the company profile.',
  ],
  quality: [
    'Chất lượng &\nhồ sơ đối chiếu.',
    'Quality &\nsupporting records.',
    'Tư liệu lịch sử được phân biệt với chứng nhận hiện hành cần xác minh.',
    'Historical references are distinguished from current certificates requiring verification.',
  ],
  partners: [
    'Kết nối qua\ntư liệu hợp tác.',
    'Connections through\ncompany records.',
    'Khách hàng và cơ cấu kinh doanh trong hồ sơ năm 2022; không phải dữ liệu quan hệ hiện tại.',
    'Customer references and business composition from the 2022 profile, not current relationship data.',
  ],
  news: [
    'Tin tức &\ngóc nhìn nghề may.',
    'Journal &\ngarment perspectives.',
    'Những bài viết để hiểu thêm về chất liệu, sản phẩm và hợp tác.',
    'Editorial perspectives on materials, products and collaboration.',
  ],
};
const heroCopy = [
  {
    key: 'hero-preview-1',
    vi: 'Từ từng đường kim,\nđến giá trị.',
    en: 'Thoughtfully made.\nPrecisely sewn.',
    excerptVi: 'HUGAMEX — Công ty Cổ phần May Hữu Nghị. Khám phá câu chuyện và sản phẩm may mặc.',
    excerptEn: 'HUGAMEX — Huu Nghi Garment. Explore garment products and perspectives.',
    metadata: {
      link: '/gioi-thieu',
      externalImageUrl: photos.heroFactory.url,
    },
  },
  {
    key: 'hero-preview-2',
    vi: 'Chất liệu mở đầu.\nChi tiết tiếp nối.',
    en: 'It starts with materials.\nDetails follow.',
    excerptVi: 'Từ cấu trúc vải đến những công đoạn tạo nên một sản phẩm.',
    excerptEn: 'From fabric construction to the stages that shape a garment.',
    metadata: {
      link: '/nang-luc-san-xuat',
      externalImageUrl: photos.fabricColour.url,
    },
  },
  {
    key: 'hero-preview-3',
    vi: 'Kết nối ý tưởng,\nmở đầu hợp tác.',
    en: 'Connect ideas.\nStart a conversation.',
    excerptVi: 'Chia sẻ nhu cầu sản phẩm để cùng tìm hiểu những bước tiếp theo.',
    excerptEn: 'Share product requirements and explore the next steps.',
    metadata: {
      link: '/lien-he',
      externalImageUrl: photos.finishing.url,
    },
  },
];
export function presentationSlides(locale: string): Content[] {
  return heroCopy.map((slide) => ({
    id: slide.key,
    kind: 'HERO',
    status: 'PUBLISHED',
    featured: true,
    featuredMediaId: null,
    featuredMediaAlt:
      locale === 'vi'
        ? 'Ảnh stock minh họa ngành may và hợp tác; không phải tư liệu HUGAMEX'
        : 'Illustrative stock of garment production and cooperation, not HUGAMEX documentation',
    publishedAt: null,
    locale,
    title: locale === 'vi' ? slide.vi : slide.en,
    excerpt: locale === 'vi' ? slide.excerptVi : slide.excerptEn,
    slug: slide.key,
    content: { type: 'doc', content: [] },
    seoTitle: '',
    seoDescription: '',
    metadata: slide.metadata,
    categoryIds: [],
  }));
}
