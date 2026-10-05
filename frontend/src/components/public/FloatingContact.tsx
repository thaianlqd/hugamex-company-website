import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Phone, X, Mail, MapPin, ArrowUpRight } from 'lucide-react';
export default function FloatingContact({ settings }: { settings: Record<string, string> }) {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const phone = settings.contactPhone;
  const number = phone?.replace(/[^+0-9]/g, '');
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const outside = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('mousedown', outside);
    return () => {
      document.removeEventListener('keydown', dismiss);
      document.removeEventListener('mousedown', outside);
    };
  }, [open]);
  if (!number) return null;
  return (
    <div className="floating-contact" ref={root}>
      {open && (
        <section
          id="quick-contact"
          className="floating-contact-panel"
          role="dialog"
          aria-label={vi ? 'Liên hệ HUGAMEX' : 'Contact HUGAMEX'}
        >
          <div className="floating-contact-heading">
            <span>HUGAMEX / {vi ? 'LIÊN HỆ' : 'CONTACT'}</span>
            <button
              ref={close}
              aria-label={vi ? 'Đóng liên hệ' : 'Close contact'}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <X size={18} />
            </button>
          </div>
          <h2>{vi ? 'Cùng trao đổi về nhu cầu của bạn.' : 'Let’s discuss your requirements.'}</h2>
          <a className="floating-call" href={`tel:${number}`}>
            <Phone size={18} />
            <span>
              <small>{vi ? 'Gọi điện' : 'Call us'}</small>
              {phone}
            </span>
            <ArrowUpRight size={18} />
          </a>
          {settings.contactEmail && (
            <a className="floating-email" href={`mailto:${settings.contactEmail}`}>
              <Mail size={16} />
              {settings.contactEmail}
            </a>
          )}
          <Link className="floating-enquiry" to="/lien-he" onClick={() => setOpen(false)}>
            {vi ? 'Gửi yêu cầu hợp tác' : 'Send an enquiry'}
            <ArrowUpRight size={16} />
          </Link>
          {settings.contactAddress && (
            <a
              className="floating-directions"
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings.contactAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={16} />
              {vi ? 'Đường đến trụ sở chính' : 'Directions to head office'}
              <ArrowUpRight size={16} />
            </a>
          )}
        </section>
      )}
      <button
        ref={trigger}
        className="floating-contact-trigger"
        aria-label={vi ? 'Mở liên hệ nhanh' : 'Open quick contact'}
        aria-expanded={open}
        aria-controls={open ? 'quick-contact' : undefined}
        onClick={() => setOpen(!open)}
      >
        <Phone size={23} />
      </button>
    </div>
  );
}
