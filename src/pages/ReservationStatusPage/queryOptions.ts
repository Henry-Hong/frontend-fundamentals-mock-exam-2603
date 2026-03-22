import { getMyReservations, getReservations, getRooms } from '../../remotes/remotes';

export const MY_RESERVATIONS_QUERY_KEY = ['myReservations'] as const;
export const ROOMS_QUERY_KEY = ['rooms'] as const;
export const RESERVATIONS_QUERY_KEY = ['reservations'] as const;

export const myReservationListQueryOptions = () => ({
  queryKey: [...MY_RESERVATIONS_QUERY_KEY],
  queryFn: () => getMyReservations(),
});

export const roomsQueryOptions = () => ({
  queryKey: [...ROOMS_QUERY_KEY],
  queryFn: () => getRooms(),
});

export const reservationsQueryOptions = (date: string) => ({
  queryKey: [...RESERVATIONS_QUERY_KEY, date],
  queryFn: () => getReservations(date),
});
