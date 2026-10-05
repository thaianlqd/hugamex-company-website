import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { State } from '../../components/common/Shared';

export default function MediaPreview({ id, alt }: { id: string; alt: string }) {
  const [url, setUrl] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'media-preview', id],
    queryFn: async () => (await api.get<Blob>(`/media/${id}`, { responseType: 'blob' })).data,
  });
  useEffect(() => {
    if (!query.data || !query.data.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);
  return query.isPending || query.isError ? (
    <State loading={query.isPending} error={query.isError} retry={() => void query.refetch()} />
  ) : url ? (
    <img className="article-hero" src={url} alt={alt} width="1200" height="675" />
  ) : null;
}
