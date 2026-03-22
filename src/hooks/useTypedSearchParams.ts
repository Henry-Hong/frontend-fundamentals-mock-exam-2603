import qs from 'qs';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { z } from 'zod';
import { TypedQueryByPath, TypedPath } from './useTypedRouter';

export function useTypedSearchParams<Path extends TypedPath>(path: Path) {
  const location = useLocation();
  const params = useMemo(() => qs.parse(location.search, { ignoreQueryPrefix: true }), [location.search]);
  return useMemo(
    () => TypedQueryByPath[path].parse(params) as z.infer<(typeof TypedQueryByPath)[Path]>,
    [params, path]
  );
}
