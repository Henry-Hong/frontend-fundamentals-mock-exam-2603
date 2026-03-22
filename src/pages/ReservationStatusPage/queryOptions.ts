import { getMyReservations, getReservations, getRooms } from '../../remotes/remotes';

export const myReservationListQueryOptions = {
  queryKey: ['myReservations'],
  queryFn: () => getMyReservations(),
};

export const roomsQueryOptions = {
  queryKey: ['rooms'],
  queryFn: () => getRooms(),
};

export const reservationsQueryOptions = {
  queryKey: ['reservations'],
  queryFn: (date: string) => getReservations(date),
};
