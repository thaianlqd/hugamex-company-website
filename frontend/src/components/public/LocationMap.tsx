import { useTranslation } from 'react-i18next';
import { ArrowUpRight, MapPin } from 'lucide-react';
export default function LocationMap({
  address,
  label,
  compact = false,
}: {
  address: string;
  label: string;
  compact?: boolean;
}) {
  const { i18n } = useTranslation();
  const query = encodeURIComponent(address);
  return (
    <div className={`location-map${compact ? ' location-map-compact' : ''}`}>
      <iframe
        title={`${label} — Google Maps`}
        src={`https://www.google.com/maps?q=${query}&output=embed&hl=${i18n.language === 'vi' ? 'vi' : 'en'}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MapPin size={16} />
        {i18n.language === 'vi' ? 'Mở địa chỉ trên Google Maps' : 'Open address in Google Maps'}
        <ArrowUpRight size={16} />
      </a>
    </div>
  );
}
