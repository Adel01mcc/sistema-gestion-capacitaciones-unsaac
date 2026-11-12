import { useEffect, useState } from 'react';
import { errorMessage, request } from './api';
import type { ListResponse, PageMeta } from './types';

export function usePaged<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    request<ListResponse<T>>(path).then((result) => {
      if (active) { setData(result.data); setMeta(result.meta); }
    }).catch((failure: unknown) => { if (active) setError(errorMessage(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, revision]);
  return { data, meta, loading, error, reload: () => setRevision((value) => value + 1) };
}
