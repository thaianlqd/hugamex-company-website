import { useTranslation } from 'react-i18next';
import ContentImage from '../common/ContentImage';
import photos from '../../content/stockPhotos.json';
export type PhotoKey = keyof typeof photos;
export default function BrandImage({
  photo,
  className = '',
}: {
  photo: PhotoKey;
  className?: string;
}) {
  const { i18n } = useTranslation();
  const asset = photos[photo];
  return (
    <figure className={`brand-image ${className}`}>
      <ContentImage
        src={asset.url}
        alt={i18n.language === 'vi' ? asset.altVi : asset.altEn}
        width={1440}
        height={960}
      />
      <figcaption>{i18n.language === 'vi' ? 'Ảnh minh họa' : 'Illustrative photograph'}</figcaption>
    </figure>
  );
}
