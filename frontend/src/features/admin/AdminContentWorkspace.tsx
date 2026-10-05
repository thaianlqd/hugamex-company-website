import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminContentList, AdminContentEditor } from './AdminContent';
const resources = new Set([
  'posts',
  'pages',
  'categories',
  'product-categories',
  'products',
  'branches',
  'partners',
  'certifications',
]);
export default function AdminContentWorkspace() {
  const { resource = 'posts', id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const allowed = resources.has(resource);
  const opened = Boolean(id && allowed);
  useEffect(() => {
    if (!opened) return;
    opener.current = document.activeElement as HTMLElement;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal?.showModal();
    return () => {
      modal?.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus();
    };
  }, [opened]);
  if (!allowed)
    return (
      <div className="public-empty">
        <h1>404</h1>
        <p>
          {i18n.language === 'vi'
            ? 'Mục này không có trong CMS nội dung.'
            : 'This section is unavailable in the content CMS.'}
        </p>
      </div>
    );
  return (
    <>
      <AdminContentList />
      {id && (
        <dialog
          className="content-editor-modal"
          ref={dialog}
          aria-labelledby="content-modal-title"
          onCancel={(event) => {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            dialog.current?.querySelector<HTMLButtonElement>('[data-editor-close]')?.click();
          }}
        >
          <AdminContentEditor onClose={() => navigate(`/admin/${resource}`)} />
        </dialog>
      )}
    </>
  );
}
