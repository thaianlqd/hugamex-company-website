import { useTranslation } from 'react-i18next';
export default function Pagination({
  page,
  total,
  size,
  setPage,
}: {
  page: number;
  total: number;
  size: number;
  setPage: (p: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="pagination">
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>
        {t('previous')}
      </button>
      <span>
        {page + 1} / {Math.max(1, Math.ceil(total / size))}
      </span>
      <button disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)}>
        {t('next')}
      </button>
    </div>
  );
}
