import { useCallback, useEffect, useRef, useState } from 'react';

// Bir API fonksiyonunu çağırıp yükleniyor/hata/veri durumunu yönetir.
// const { data, loading, error, reload, setData } = useApi(getInvoices);
export default function useApi(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);

  const run = useCallback(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => run(), [run]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    run();
  }, [run]);

  const setData = useCallback(
    (updater) =>
      setState((s) => ({
        ...s,
        data: typeof updater === 'function' ? updater(s.data) : updater,
      })),
    []
  );

  return { ...state, reload, setData };
}
