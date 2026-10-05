import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, X } from 'lucide-react';
export function useAdminToast() {
  const [message, setMessage] = useState('');
  const { t } = useTranslation();
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);
  return {
    toast: setMessage,
    toastNode: (
      <div className="admin-toast-region" role="status" aria-live="polite" aria-atomic="true">
        {message && (
          <div className="admin-toast">
            <CheckCircle2 size={18} />
            <span>{message}</span>
            <button type="button" aria-label={t('close')} onClick={() => setMessage('')}>
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    ),
  };
}
export function useAdminDialog() {
  const { t, i18n } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const task = useRef<(() => Promise<void>) | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const confirm = (text: string, action?: () => Promise<void>) => {
    trigger.current = document.activeElement as HTMLElement;
    task.current = action;
    setMessage(text);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  };
  useEffect(() => {
    if (message) dialog.current?.showModal();
  }, [message]);
  const finish = (result: boolean) => {
    dialog.current?.close();
    setMessage('');
    resolver.current?.(result);
    resolver.current = null;
    trigger.current?.focus();
  };
  return {
    confirm,
    dialogNode: (
      <dialog
        className="admin-dialog"
        ref={dialog}
        aria-labelledby="admin-dialog-title"
        aria-describedby="admin-dialog-message"
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) finish(false);
        }}
      >
        <h2 id="admin-dialog-title">
          {i18n.language === 'vi' ? 'Xác nhận thao tác' : 'Confirm action'}
        </h2>
        <p id="admin-dialog-message">{message}</p>
        <div className="form-actions">
          <button type="button" className="button secondary" disabled={busy} onClick={() => finish(false)}>
            {t('cancel')}
          </button>
          <button
            type="button" className="button"
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                try {
                  await task.current?.();
                  finish(true);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {busy ? t('loading') : i18n.language === 'vi' ? 'Xác nhận' : 'Confirm'}
          </button>
        </div>
      </dialog>
    ),
  };
}
