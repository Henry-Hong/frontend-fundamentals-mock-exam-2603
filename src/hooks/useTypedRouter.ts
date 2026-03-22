import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { stringify } from 'qs';
import { z } from 'zod';

export function useTypedRouter() {
  const navigate = useNavigate();
  return useMemo(() => {
    return {
      back(steps = 1) {
        navigate(-steps);
      },
      push<Path extends TypedPath>(path: Path, search?: z.infer<(typeof TypedQueryByPath)[Path]>) {
        navigate({ pathname: path, search: search ? stringify(search, { indices: true }) : undefined });
      },
      replace<Path extends TypedPath>(path: Path, search?: z.infer<(typeof TypedQueryByPath)[Path]>) {
        navigate(
          { pathname: path, search: search ? stringify(search, { indices: true }) : undefined },
          { replace: true }
        );
      },
    };
  }, [navigate]);
}

export const TypedQueryByPath = {
  '/': z.object({
    message: z.string().optional(),
  }),
  '/booking': z.object({
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    attendees: z.coerce.number().optional(),
    equipment: z.array(z.string()).optional(),
    floor: z.coerce.number().optional(),
  }),
} as const;

export type TypedPath = keyof typeof TypedQueryByPath;
